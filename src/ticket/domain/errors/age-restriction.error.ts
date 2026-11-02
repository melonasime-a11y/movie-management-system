import { ForbiddenError } from '../../../shared/domain/errors';

export class AgeRestrictionError extends ForbiddenError {
  constructor(ageRestriction: number) {
    super(
      `Customer age does not meet the movie age restriction of ${ageRestriction}`,
    );
  }
}
