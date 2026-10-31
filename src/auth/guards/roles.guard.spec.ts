import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../user/domain/entities/user-role.enum';
import { Roles } from '../presentation/decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

class TestController {}

const open = () => {};
const managerOnly = () => {};
Roles(UserRole.MANAGER)(managerOnly);

function contextFor(handler: () => void, user?: { role?: string }): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any user on a route without @Roles', () => {
    expect(guard.canActivate(contextFor(open, { role: UserRole.CUSTOMER }))).toBe(true);
  });

  it('allows a user whose role is listed in @Roles', () => {
    expect(guard.canActivate(contextFor(managerOnly, { role: UserRole.MANAGER }))).toBe(true);
  });

  it('denies a user whose role is not listed in @Roles', () => {
    expect(guard.canActivate(contextFor(managerOnly, { role: UserRole.CUSTOMER }))).toBe(false);
  });

  it('denies when no authenticated user is on the request', () => {
    expect(guard.canActivate(contextFor(managerOnly))).toBe(false);
  });
});
