import { DataSource } from 'typeorm';

import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketAlreadyExistsError } from '../../domain/errors/ticket-already-exists.error';
import { TicketOrmEntity } from '../persistence/ticket.orm-entity';
import { TypeOrmTicketRepository } from './typeorm-ticket.repository';

describe('TypeOrmTicketRepository (SQLite)', () => {
  let dataSource: DataSource;
  let repository: TypeOrmTicketRepository;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [TicketOrmEntity],
      synchronize: true,
    });
    await dataSource.initialize();
    repository = new TypeOrmTicketRepository(
      dataSource.getRepository(TicketOrmEntity),
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('translates a UNIQUE(userId, sessionId) violation into TicketAlreadyExistsError', async () => {
    await repository.save(Ticket.create({ userId: 1, sessionId: 1 }));

    await expect(
      repository.save(Ticket.create({ userId: 1, sessionId: 1 })),
    ).rejects.toBeInstanceOf(TicketAlreadyExistsError);
  });
});
