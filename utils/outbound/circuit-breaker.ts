import {
  DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
  DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
} from './constants';
import { OutboundCircuitBreakerConfig } from './types';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

type CircuitEntry = {
  state: CircuitState;
  failures: number;
  openedAt: number;
  failureThreshold: number;
  resetTimeoutMs: number;
};

/**
 * Lightweight in-memory circuit breaker, keyed by downstream service name.
 * Intentionally simple — one breaker per process, no distributed state.
 */
class CircuitBreakerRegistry {
  private readonly circuits = new Map<string, CircuitEntry>();

  canRequest(serviceName: string, config: OutboundCircuitBreakerConfig): boolean {
    const circuit = this.getOrCreate(serviceName, config);

    if (circuit.state === 'CLOSED') return true;

    if (circuit.state === 'OPEN') {
      if (Date.now() - circuit.openedAt >= circuit.resetTimeoutMs) {
        circuit.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow a single probe (caller records success/failure)
    return true;
  }

  recordSuccess(serviceName: string, config: OutboundCircuitBreakerConfig): void {
    const circuit = this.getOrCreate(serviceName, config);
    circuit.failures = 0;
    circuit.state = 'CLOSED';
  }

  recordFailure(serviceName: string, config: OutboundCircuitBreakerConfig): void {
    const circuit = this.getOrCreate(serviceName, config);
    circuit.failures += 1;

    if (
      circuit.state === 'HALF_OPEN' ||
      circuit.failures >= circuit.failureThreshold
    ) {
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
    }
  }

  /** Test / ops helper — not required by the pipeline. */
  getState(serviceName: string): CircuitState | null {
    return this.circuits.get(serviceName)?.state ?? null;
  }

  reset(serviceName?: string): void {
    if (serviceName) {
      this.circuits.delete(serviceName);
      return;
    }
    this.circuits.clear();
  }

  private getOrCreate(
    serviceName: string,
    config: OutboundCircuitBreakerConfig,
  ): CircuitEntry {
    let circuit = this.circuits.get(serviceName);
    if (!circuit) {
      circuit = {
        state: 'CLOSED',
        failures: 0,
        openedAt: 0,
        failureThreshold:
          config.failureThreshold ?? DEFAULT_CIRCUIT_FAILURE_THRESHOLD,
        resetTimeoutMs:
          config.resetTimeoutMs ?? DEFAULT_CIRCUIT_RESET_TIMEOUT_MS,
      };
      this.circuits.set(serviceName, circuit);
    } else {
      circuit.failureThreshold =
        config.failureThreshold ?? circuit.failureThreshold;
      circuit.resetTimeoutMs =
        config.resetTimeoutMs ?? circuit.resetTimeoutMs;
    }
    return circuit;
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

export class OutboundCircuitOpenError extends Error {
  readonly serviceName: string;

  constructor(serviceName: string) {
    super(`Circuit open for downstream service: ${serviceName}`);
    this.name = 'OutboundCircuitOpenError';
    this.serviceName = serviceName;
  }
}
