import { useCallback, useMemo, useState } from 'react';
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi';
import { Contract, formatEther } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/GameApp.css';
import { Header } from './Header';

type MetaTuple = readonly [bigint, readonly boolean[], boolean];

type DecryptionState = {
  cards: Record<number, number>;
  system: Record<number, number>;
  score?: number;
};

const ROUND_COUNT = 3;

export function GameApp() {
  const { address, isConnected, chain } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: isInstanceLoading, error: zamaError } = useZamaInstance();
  const [isStarting, setIsStarting] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [decrypted, setDecrypted] = useState<DecryptionState>({ cards: {}, system: {} });

  const contractReadsEnabled = Boolean(address);

  const { data: metaData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameMeta',
    args: address ? [address] : undefined,
    query: {
      enabled: contractReadsEnabled,
      refetchOnWindowFocus: false,
    },
  });

  const meta = (metaData || [0n, [false, false, false], false]) as MetaTuple;
  const roundsPlayed = Number(meta[0] ?? 0n);
  const usedCards = meta[1] ?? [false, false, false];
  const initialized = meta[2] ?? false;

  const cardsRead = useReadContracts({
    contracts: address && initialized
      ? Array.from({ length: ROUND_COUNT }, (_, index) => ({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPlayerCard',
          args: [address, BigInt(index)],
        }))
      : [],
    allowFailure: true,
    query: {
      enabled: Boolean(address && initialized),
      refetchOnWindowFocus: false,
    },
  });

  const systemRead = useReadContracts({
    contracts: address && initialized
      ? Array.from({ length: ROUND_COUNT }, (_, index) => ({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getSystemCard',
          args: [address, BigInt(index)],
        }))
      : [],
    allowFailure: true,
    query: {
      enabled: Boolean(address && initialized && roundsPlayed > 0),
      refetchOnWindowFocus: false,
    },
  });

  const { data: scoreData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getScore',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && initialized),
      refetchOnWindowFocus: false,
    },
  });

  const balanceQuery = useBalance({
    address,
    chainId: chain?.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const playerCards = useMemo(() => {
    if (!cardsRead.data) {
      return [];
    }
    return cardsRead.data.map((item) => (item?.result as `0x${string}` | undefined) ?? undefined);
  }, [cardsRead.data]);

  const systemCards = useMemo(() => {
    if (!systemRead.data) {
      return [];
    }
    return systemRead.data.map((item) => (item?.result as `0x${string}` | undefined) ?? undefined);
  }, [systemRead.data]);

  const scoreHandle = scoreData as `0x${string}` | undefined;

  const formattedBalance = useMemo(() => {
    if (!balanceQuery.data) {
      return undefined;
    }
    try {
      const value = Number(formatEther(balanceQuery.data.value));
      return `${value.toFixed(4)} ${balanceQuery.data.symbol}`;
    } catch {
      return `${balanceQuery.data.value} ${balanceQuery.data.symbol}`;
    }
  }, [balanceQuery.data]);

  const pushMessage = useCallback((text: string) => {
    setMessages((prev) => [text, ...prev].slice(0, 5));
  }, []);

  const handleStartGame = useCallback(async () => {
    if (!signerPromise) {
      pushMessage('Signer unavailable. Connect your wallet.');
      return;
    }

    try {
      setIsStarting(true);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Signer not ready');
      }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.startGame();
      pushMessage(`Start game tx submitted: ${tx.hash}`);
      await tx.wait();
      pushMessage('Game started. Your encrypted hand is ready.');
      setDecrypted({ cards: {}, system: {} });
    } catch (error) {
      console.error(error);
      pushMessage(error instanceof Error ? error.message : 'Failed to start game');
    } finally {
      setIsStarting(false);
    }
  }, [signerPromise, pushMessage]);

  const handlePlayRound = useCallback(async (cardIndex: number) => {
    if (!signerPromise) {
      pushMessage('Signer unavailable. Connect your wallet.');
      return;
    }
    try {
      setIsPlaying(cardIndex);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Signer not ready');
      }
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.playRound(cardIndex);
      pushMessage(`Round ${cardIndex + 1} submitted: ${tx.hash}`);
      await tx.wait();
      pushMessage('Round completed. Decrypt your score to check the result.');
    } catch (error) {
      console.error(error);
      pushMessage(error instanceof Error ? error.message : 'Unable to play round');
    } finally {
      setIsPlaying(null);
    }
  }, [signerPromise, pushMessage]);

  const decryptHandles = useCallback(
    async (handles: (`0x${string}`)[]): Promise<Record<string, number>> => {
      if (!instance || !address || !signerPromise) {
        throw new Error('Encryption service is not ready yet');
      }

      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Signer not available');
      }

      const keypair = instance.generateKeypair();
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contractAddresses = [CONTRACT_ADDRESS];
      const handleContractPairs = handles.map((handle) => ({
        handle,
        contractAddress: CONTRACT_ADDRESS,
      }));

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      return handles.reduce<Record<string, number>>((acc, handle) => {
        const clearValue = result[handle] || '0';
        acc[handle] = Number(clearValue);
        return acc;
      }, {});
    },
    [address, instance, signerPromise]
  );

  const handleDecryptCards = useCallback(async () => {
    const handleEntries = playerCards
      .map((handle, index) => ({ handle, index }))
      .filter((entry): entry is { handle: `0x${string}`; index: number } => Boolean(entry.handle));

    if (handleEntries.length === 0) {
      pushMessage('No cards available to decrypt. Start a game first.');
      return;
    }

    try {
      setDecrypting(true);
      const handles = handleEntries.map((entry) => entry.handle);
      const values = await decryptHandles(handles);
      setDecrypted((prev) => {
        const updated = { ...prev, cards: { ...prev.cards } };
        handleEntries.forEach(({ handle, index }) => {
          updated.cards[index] = values[handle];
        });
        return updated;
      });
      pushMessage('Cards decrypted locally.');
    } catch (error) {
      console.error(error);
      pushMessage(error instanceof Error ? error.message : 'Failed to decrypt cards');
    } finally {
      setDecrypting(false);
    }
  }, [playerCards, decryptHandles, pushMessage]);

  const handleDecryptScore = useCallback(async () => {
    if (!scoreHandle) {
      pushMessage('Score is not available yet.');
      return;
    }

    try {
      setDecrypting(true);
      const result = await decryptHandles([scoreHandle]);
      setDecrypted((prev) => ({ ...prev, score: result[scoreHandle] }));
      pushMessage('Score decrypted.');
    } catch (error) {
      console.error(error);
      pushMessage(error instanceof Error ? error.message : 'Failed to decrypt score');
    } finally {
      setDecrypting(false);
    }
  }, [scoreHandle, decryptHandles, pushMessage]);

  const handleDecryptSystemCard = useCallback(async (index: number) => {
    const handle = systemCards[index];
    if (!handle) {
      pushMessage('System card not available yet.');
      return;
    }

    try {
      setDecrypting(true);
      const result = await decryptHandles([handle]);
      setDecrypted((prev) => ({
        ...prev,
        system: { ...prev.system, [index]: result[handle] },
      }));
      pushMessage(`System card for round ${index + 1} decrypted.`);
    } catch (error) {
      console.error(error);
      pushMessage(error instanceof Error ? error.message : 'Failed to decrypt system card');
    } finally {
      setDecrypting(false);
    }
  }, [systemCards, decryptHandles, pushMessage]);

  const canPlayRound = useCallback(
    (index: number) => initialized && !usedCards[index] && roundsPlayed < ROUND_COUNT && !decrypting,
    [initialized, usedCards, roundsPlayed, decrypting]
  );

  return (
    <div className="game-app">
      <Header />
      <main className="game-main">
        <section className="panel overview-panel">
          <div className="panel-header">
            <h2>Encrypted Wars</h2>
            <ConnectButton />
          </div>
          <div className="panel-body">
            <p className="description">
              Draw encrypted cards, outplay the system, and keep your hand private with Zama FHE.
            </p>
            <div className="status-grid">
              <div>
                <span className="status-label">Player</span>
                <span className="status-value">{address || 'Not connected'}</span>
              </div>
              <div>
                <span className="status-label">Rounds Played</span>
                <span className="status-value">{roundsPlayed} / {ROUND_COUNT}</span>
              </div>
              <div>
                <span className="status-label">Contract</span>
                <span className="status-value">{CONTRACT_ADDRESS}</span>
              </div>
              <div>
                <span className="status-label">Network</span>
                <span className="status-value">{chain?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="status-label">Balance</span>
                <span className="status-value">{formattedBalance || '—'}</span>
              </div>
            </div>
            <div className="cta-row">
              <button
                className="primary-button"
                onClick={handleStartGame}
                disabled={!isConnected || isStarting || decrypting}
              >
                {isStarting ? 'Starting...' : initialized ? 'Restart Game' : 'Start Game'}
              </button>
              <button
                className="secondary-button"
                onClick={handleDecryptCards}
                disabled={!initialized || decrypting || playerCards.length === 0}
              >
                {decrypting ? 'Decrypting...' : 'Decrypt My Hand'}
              </button>
            </div>
            {zamaError && <p className="error">{zamaError}</p>}
            {!isInstanceLoading && !instance && (
              <p className="info">Initializing Zama SDK...</p>
            )}
          </div>
        </section>

        <section className="panel hand-panel">
          <h3>Your Encrypted Hand</h3>
          <div className="card-grid">
            {Array.from({ length: ROUND_COUNT }, (_, index) => {
              const handle = playerCards[index];
              const value = decrypted.cards[index];
              const used = usedCards[index];
              return (
                <div key={index} className={`card-tile ${used ? 'card-used' : ''}`}>
                  <div className="card-header">
                    <span className="card-title">Card {index + 1}</span>
                    <span className="card-status">{used ? 'Played' : 'Ready'}</span>
                  </div>
                  <div className="card-body">
                    <p className="card-handle">{handle || '—'}</p>
                    <p className="card-value">{value !== undefined ? value : 'Hidden'}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="primary-button"
                      onClick={() => handlePlayRound(index)}
                      disabled={!canPlayRound(index) || isPlaying === index}
                    >
                      {isPlaying === index ? 'Playing...' : 'Play Card'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel system-panel">
          <h3>System Rounds</h3>
          <div className="card-grid">
            {Array.from({ length: ROUND_COUNT }, (_, index) => {
              const revealed = decrypted.system[index];
              const available = roundsPlayed > index;
              const handle = systemCards[index];
              return (
                <div key={index} className="system-tile">
                  <div className="card-header">
                    <span className="card-title">Round {index + 1}</span>
                    <span className="card-status">{available ? 'Available' : 'Locked'}</span>
                  </div>
                  <div className="card-body">
                    <p className="card-handle">{handle || '—'}</p>
                    <p className="card-value">{revealed !== undefined ? revealed : 'Encrypted'}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="secondary-button"
                      onClick={() => handleDecryptSystemCard(index)}
                      disabled={!available || decrypting || !handle}
                    >
                      {decrypting ? 'Decrypting...' : 'Reveal System Card'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel score-panel">
          <div className="panel-header">
            <h3>Encrypted Score</h3>
            <button
              className="primary-button"
              onClick={handleDecryptScore}
              disabled={!scoreHandle || decrypting}
            >
              {decrypting ? 'Decrypting...' : 'Decrypt Score'}
            </button>
          </div>
          <div className="panel-body">
            <div className="score-row">
              <span className="status-label">Encrypted Handle</span>
              <span className="status-value">{scoreHandle || '—'}</span>
            </div>
            <div className="score-row">
              <span className="status-label">Clear Score</span>
              <span className="status-value score-value">
                {decrypted.score !== undefined ? `${decrypted.score} / ${ROUND_COUNT}` : 'Hidden'}
              </span>
            </div>
          </div>
        </section>

        <section className="panel activity-panel">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            {messages.length === 0 ? (
              <li className="activity-empty">Actions will appear here.</li>
            ) : (
              messages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
