/**
 * Olmera Healthcare - Sliding Window Rate Limit & Token Usage Tracker
 * 
 * Provides rolling 60-second window accounting for Requests-Per-Minute (RPM)
 * and Tokens-Per-Minute (TPM), plus calendar-day accounting (RPD / TPD).
 */

interface RequestRecord {
  timestamp: number;
  tokens: number;
}

export class KeySlidingWindow {
  private records: RequestRecord[] = [];
  private dailyRequestCount: number = 0;
  private dailyTokenCount: number = 0;
  private currentDay: string;

  constructor() {
    this.currentDay = this.getTodayDateString();
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private cleanStaleRecords(now: number = Date.now()): void {
    const oneMinuteAgo = now - 60000;
    this.records = this.records.filter(r => r.timestamp > oneMinuteAgo);

    // Reset daily counters if day has rolled over
    const today = this.getTodayDateString();
    if (today !== this.currentDay) {
      this.currentDay = today;
      this.dailyRequestCount = 0;
      this.dailyTokenCount = 0;
    }
  }

  /**
   * Record a new request and its token consumption
   */
  public recordUsage(tokens: number, timestamp: number = Date.now()): void {
    this.cleanStaleRecords(timestamp);
    this.records.push({ timestamp, tokens });
    this.dailyRequestCount += 1;
    this.dailyTokenCount += tokens;
  }

  /**
   * Get current rolling 60-second request count
   */
  public getRPM(now: number = Date.now()): number {
    this.cleanStaleRecords(now);
    return this.records.length;
  }

  /**
   * Get current rolling 60-second token count
   */
  public getTPM(now: number = Date.now()): number {
    this.cleanStaleRecords(now);
    return this.records.reduce((sum, r) => sum + r.tokens, 0);
  }

  /**
   * Get requests executed today
   */
  public getDailyRequests(now: number = Date.now()): number {
    this.cleanStaleRecords(now);
    return this.dailyRequestCount;
  }

  /**
   * Get tokens consumed today
   */
  public getDailyTokens(now: number = Date.now()): number {
    this.cleanStaleRecords(now);
    return this.dailyTokenCount;
  }

  /**
   * Reset tracking state
   */
  public reset(): void {
    this.records = [];
    this.dailyRequestCount = 0;
    this.dailyTokenCount = 0;
    this.currentDay = this.getTodayDateString();
  }
}
