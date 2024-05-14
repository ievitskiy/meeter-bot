import {
  ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import { Injectable, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  InlineKeyboard,
  session,
} from 'grammy';
import { DatabaseService } from 'src/database/database.service';
import { PrismaService } from 'src/prisma.service';
import { createForm } from 'tools/createFormConversation';
import { findCompanion } from 'tools/findCompanionConversation';
import { sendForm } from 'tools/replies';

@Injectable()
export class BotService extends PrismaService implements OnModuleInit {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.launchBot();
  }

  async launchBot() {
    type MyContext = Context & ConversationFlavor;

    const bot = new Bot<MyContext>(process.env.BOT_TOKEN);

    bot.use(session({ initial: () => ({}) }));
    bot.use(conversations());
    bot.use(createConversation(createForm));
    bot.use(createConversation(findCompanion));

    // const menu = new Menu('create-form-menu').text('Создать анкету', (ctx) =>
    //   ctx.reply('Давай'),
    // );

    // bot.use(menu);

    bot.catch((err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;
      if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
      } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e);
      } else {
        console.error('Unknown error:', e);
      }

      ctx.reply('Произошла внутренняя ошибка');
    });

    bot.command('start', async (ctx) => {
      let user = await this.database.getUserByTgId(ctx.from.id);

      if (!user) {
        await this.database.registerUser(ctx.from);
      }

      user = await this.database.getUserByTgId(ctx.from.id);

      const user_name = user.form_is_exist
        ? user.form_name
        : user.tg_first_name;

      await ctx.reply(`Привет \*${user_name}*`, { parse_mode: 'MarkdownV2' });
      sendForm(user, ctx);
    });

    bot.on('message:text', async (ctx) => {
      const user = await this.database.getUserByTgId(ctx.from.id);
      const text = ctx.message.text;
      if (text === 'Создать анкету') {
        await ctx.conversation.enter('createForm');
      } else if ((text === '📖' || text === '2') && user.form_is_exist) {
        await ctx.conversation.enter('createForm');
      } else if ((text === '💤' || text === '3') && user.form_is_exist) {
        await ctx.reply('Under maintenance');
      } else if ((text === '🔎' || text === '1') && user.form_is_exist) {
        await ctx.conversation.enter('findCompanion');
      } else if (text === 'show me') {
        ctx.replyWithPhoto(
          'AgACAgIAAxkBAAIK5mYx9bN_-W79IZk-hoB-N6D8l7IlAAIq2zEbBceQSd231o4WKoieAQADAgADeQADNAQ',
          {
            caption: 'Подпись',
            reply_markup: new InlineKeyboard().url(
              'Пользователь',
              'tg://user?id=1542386993',
            ),
          },
        );
      } else {
        ctx.reply('Нет такого варианта ответа');
      }
    });

    // bot.api
    //   .sendMessage('цифры', 'Салам')
    //   .then(() => {
    //     console.log('Сообщение успешно отправлено!');
    //   })
    //   .catch((err) => {
    //     console.error('Не удалось отправить сообщение:', err);
    //   });

    // file_id: 'AgACAgIAAxkBAAIFtWYJURjNKlexiZqsPKQDhyzJlgRKAAJI1jEbS8lJSIB4C-hDmJh5AQADAgADeAADNAQ',
    //   file_unique_id: 'AQADSNYxG0vJSUh9',

    // await fst.copyMessage('-4191920072'); -- пересылка в другой чат

    bot.start();
  }
}
