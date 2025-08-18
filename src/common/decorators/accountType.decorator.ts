import { SetMetadata } from '@nestjs/common';
import { AccountType } from '@prisma/client';

export const ACCOUNT_TYPES_KEY = 'accountTypes';
export const AccountTypes = (...accountTypes: AccountType[]) =>
  SetMetadata(ACCOUNT_TYPES_KEY, accountTypes);
