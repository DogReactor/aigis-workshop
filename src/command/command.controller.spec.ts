import { Test, TestingModule } from '@nestjs/testing';
import { CommandController } from './command.controller';

const aigis = 'http://assets.millennium-war.net/31af3ae641b10986bf65e9f3e5bd039db97a4906/2iofz514jeks1y44k7al2ostm43xj085'

describe('Command Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CommandController],
    }).compile();
  });
  it('should get files from server', () => {
    const controller: CommandController = module.get<CommandController>(CommandController);
    expect(controller.updateFiles({ fileListUrl: aigis, cardsInfos: '{id:1}' })).toBe('Ok');
  });
});
