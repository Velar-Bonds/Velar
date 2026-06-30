import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un handler o controller como público (sin JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
