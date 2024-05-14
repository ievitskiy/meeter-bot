import { ConversationFlavor } from '@grammyjs/conversations';
import { User } from '@prisma/client';
import { CommandContext, Context } from 'grammy';
import { createFormKeyboard, menuKeyboard } from './keyboards';

export interface IForm {
  form_name?: string;
  form_gender?: string;
  form_looking_for?: string;
  form_desc?: string;
  form_image_id?: string;
  form_city?: string;
  form_age?: number;
  form_region?: string;
}

interface IReply {
  firstReply: string;
  warningReply: string;
}

export type schemaShapes =
  | 'form_name'
  | 'form_gender'
  | 'form_looking_for'
  | 'form_desc'
  | 'form_image_id'
  | 'form_city'
  | 'form_age';

type MyContext = Context & ConversationFlavor;

export async function sendForm(
  user: User,
  ctx: CommandContext<MyContext> | MyContext,
) {
  if (user.form_is_exist) {
    if (user.searching) {
      await ctx.reply('Так выглядит твоя анкета:');
      await ctx.replyWithPhoto(user.form_image_id, {
        caption: `${user.form_name}, ${user.form_city.charAt(0).toUpperCase()}${user.form_city.slice(1)}, ${user.form_age} — ${user.form_desc}`,
        reply_markup: { remove_keyboard: true },
      });
      await ctx.reply(
        '1. 🔎 Поиск собеседника \n2. 📖 Заполнить анкету заново \n3. 💤 Я больше не хочу никого искать',
        {
          parse_mode: 'HTML',
          reply_markup: menuKeyboard,
        },
      );
    } else {
      await ctx.reply(
        'Твоя анкета не участвует в поиске!\nВыбери поиск собеседника, чтобы возобновить участие.',
        { parse_mode: 'HTML' },
      );
      await ctx.reply('Так выглядит твоя анкета:', { parse_mode: 'HTML' });
      await ctx.replyWithPhoto(user.form_image_id, {
        caption: `${user.form_name}, ${user.form_city.charAt(0).toUpperCase()}${user.form_city.slice(1)}, ${user.form_age} — ${user.form_desc}`,
        reply_markup: { remove_keyboard: true },
      });
      await ctx.reply(
        '1. 🔎 Поиск собеседника \n2. 📖 Заполнить анкету заново',
        {
          parse_mode: 'HTML',
          reply_markup: menuKeyboard,
        },
      );
    }
  } else {
    await ctx.reply(
      `У тебя нету анкеты. \nДавай создадим её для поиска новых знакомств?`,
      { parse_mode: 'HTML', reply_markup: createFormKeyboard },
    );
  }
}

export const createFormReplies: Record<schemaShapes, IReply> = {
  form_name: {
    firstReply: 'Как тебя зовут?',
    warningReply: 'Введи своё имя. Количество символов не должно превышать 25.',
  },
  form_gender: {
    firstReply: 'Какого ты пола?',
    warningReply: 'Можешь выбрать своё пол по кнопке.',
  },
  form_looking_for: {
    firstReply: 'Кого ты ищешь?',
    warningReply: 'Можешь выбрать по кнопке ниже.',
  },
  form_desc: {
    firstReply: 'Введи описание для своей анкеты.',
    warningReply:
      'Введи описание, оно будет отображаться в твоей анкете. Максимально количество символов 250.',
  },
  form_image_id: {
    firstReply: 'Отправь своё фото.',
    warningReply: 'Отправь своё фото, оно будет отображаться в твоей анкете.',
  },
  form_city: {
    firstReply: 'Выбери свой город.',
    warningReply: 'Выбери город, в котором мы будем искать тебе собеседника.',
  },
  form_age: {
    firstReply: 'Введи свой возраст.',
    warningReply:
      'Введи свой возраст, по нему мы будем искать тебе собеседника. От 6 до 70 лет.',
  },
};
