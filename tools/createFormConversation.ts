import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { Context, Keyboard } from 'grammy';
import { cityRegion } from './cities';
import { db } from './db';
import {
  genderKeyboard,
  keyboardWithCurrent,
  leaveKeyboard,
  lookingForKeyboard,
} from './keyboards';
import { IForm, createFormReplies, schemaShapes, sendForm } from './replies';
import { UserFormSchema } from './schemas';

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

export async function createForm(conversation: MyConversation, ctx: MyContext) {
  const form: IForm = {};
  let user = await conversation.external(() =>
    db.user.findUnique({
      where: {
        tg_id: ctx.from.id.toString(),
      },
    }),
  );

  let context = null;

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    !!user.form_name
      ? new Keyboard().text(user.form_name).text('Отменить создание').resized()
      : leaveKeyboard,
    'form_name',
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    form.form_name = context.message.text;
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    !!user.form_age
      ? new Keyboard()
          .text(user.form_age.toString())
          .text('Отменить создание')
          .resized()
      : leaveKeyboard,
    'form_age',
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    form.form_age = +context.message.text;
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    !!user.form_city
      ? new Keyboard().text(user.form_city).text('Отменить создание').resized()
      : leaveKeyboard,
    'form_city',
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    form.form_city = context.message.text;
    form.form_region = cityRegion[context.message.text.toLowerCase()];
    // ВАЛИДАЦИЯ НА ГОРОДА ДРУГИХ СТРАН
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    genderKeyboard,
    'form_gender',
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    form.form_gender = context.message.text.toLowerCase();
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    lookingForKeyboard,
    'form_looking_for',
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    form.form_looking_for = context.message.text.toLowerCase();
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    !!user.form_desc ? keyboardWithCurrent : leaveKeyboard,
    'form_desc',
    !!user.form_desc,
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    if (context.message.text === 'Оставить текущее' && !!user.form_desc) {
      form.form_desc = user.form_desc;
    } else form.form_desc = context.message.text;
  }

  context = await getAnswerUntilEnd(
    conversation,
    ctx,
    !!user.form_image_id ? keyboardWithCurrent : leaveKeyboard,
    'form_image_id',
    !!user.form_image_id,
  );

  if (
    context.message.text === 'Отменить создание' ||
    context.message.text === '/start'
  ) {
    sendForm(user, ctx);
    return;
  } else {
    if (context.message.text === 'Оставить текущее') {
      form.form_image_id = user.form_image_id;
    } else
      form.form_image_id =
        context.message.photo[context.message.photo.length - 1].file_id;
  }

  await conversation.external(() =>
    db.user.update({
      where: { tg_id: ctx.from.id.toString() },
      data: {
        form_name: form.form_name,
        form_gender: form.form_gender.toLowerCase(),
        form_looking_for: form.form_looking_for.toLowerCase(),
        form_desc: form.form_desc,
        form_image_id: form.form_image_id,
        form_city: form.form_city.toLowerCase(),
        form_age: +form.form_age,
        form_is_exist: true,
        form_region: form.form_region,
        searching: true,
        likes: [],
      },
    }),
  );

  user = await conversation.external(() =>
    db.user.findUnique({
      where: {
        tg_id: ctx.from.id.toString(),
      },
    }),
  );

  await sendForm(user, ctx);
  return;
}

async function getAnswerUntilEnd(
  conversation: MyConversation,
  ctx: MyContext,
  keyboard: Keyboard,
  shape: schemaShapes,
  currentIsExist: boolean = false,
  warning: boolean = false,
): Promise<MyContext> {
  if (!warning) {
    await ctx.reply(createFormReplies[shape].firstReply, {
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(createFormReplies[shape].warningReply, {
      reply_markup: keyboard,
    });
  }

  const context = await conversation.wait();

  if (
    context.message.text == 'Отменить создание' ||
    (context.message.text == 'Оставить текущее' && currentIsExist)
  ) {
    return context;
  }

  const UserFormSchemaField = UserFormSchema.shape[shape];
  if (shape == 'form_image_id') {
    // Отменить создание, оставить текущее
    try {
      const image_id =
        context.message.photo[context.message.photo.length - 1].file_id;
      if (!image_id) {
        return getAnswerUntilEnd(
          conversation,
          ctx,
          keyboard,
          shape,
          currentIsExist,
          (warning = true),
        );
      }

      return context;
    } catch (error) {
      return getAnswerUntilEnd(
        conversation,
        ctx,
        keyboard,
        shape,
        currentIsExist,
        (warning = true),
      );
    }
  } else {
    if (shape == 'form_age') {
      try {
        const age = +context.message.text;
        const result = UserFormSchemaField.safeParse(age);
        if (!result.success) {
          return getAnswerUntilEnd(
            conversation,
            ctx,
            keyboard,
            shape,
            currentIsExist,
            (warning = true),
          );
        }

        return context;
      } catch (error) {
        return getAnswerUntilEnd(
          conversation,
          ctx,
          keyboard,
          shape,
          currentIsExist,
          (warning = true),
        );
      }
    }
    if (shape == 'form_city') {
      try {
        const city = context.message.text;
        const result = UserFormSchemaField.safeParse(city);
        if (
          !result.success ||
          !Object.keys(cityRegion).includes(city.toLowerCase())
        ) {
          return getAnswerUntilEnd(
            conversation,
            ctx,
            keyboard,
            shape,
            currentIsExist,
            (warning = true),
          );
        }

        return context;
      } catch (error) {
        return getAnswerUntilEnd(
          conversation,
          ctx,
          keyboard,
          shape,
          currentIsExist,
          (warning = true),
        );
      }
    } else {
      try {
        const result = UserFormSchemaField.safeParse(
          context.message.text.toLowerCase(),
        );
        if (!result.success) {
          return getAnswerUntilEnd(
            conversation,
            ctx,
            keyboard,
            shape,
            currentIsExist,
            (warning = true),
          );
        }

        return context;
      } catch (error) {
        return getAnswerUntilEnd(
          conversation,
          ctx,
          keyboard,
          shape,
          currentIsExist,
          (warning = true),
        );
      }
    }
  }
}

// TODO логи ошибок
// TODO Подбор собеседника, супер лайки, комментарии при лайке, жалоба на анкету, дизлайк
// TODO Ближайшие города в области выбранного города, добавить области к городам
// TODO Реклама каждые 60 анкет
// Cron Jobs для автоматизации
