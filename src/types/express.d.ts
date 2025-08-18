import { AccountType } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      sub: string;
      email: string;
      accountType: AccountType;
    }

    interface Request {
      user: User;
    }
  }
}
