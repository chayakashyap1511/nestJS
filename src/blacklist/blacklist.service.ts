import { Injectable } from '@nestjs/common';

@Injectable()
export class BlacklistService {
    private readonly blacklistedTokens = new Set<string>();

    add(token: string) {
        this.blacklistedTokens.add(token);
    }

    has(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }
}
