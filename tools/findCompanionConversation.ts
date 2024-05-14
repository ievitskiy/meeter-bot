import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { Context } from 'grammy';
import { db } from './db';
import { assessmentKeyboard } from './keyboards';
import { sendForm } from './replies';

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const shuffle = (array: Array<Record<string, string>>) => {
  let m = array.length,
    t,
    i;

  // Пока есть элементы для перемешивания
  while (m) {
    // Взять оставшийся элемент
    i = Math.floor(Math.random() * m--);

    // И поменять его местами с текущим элементом
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

const comparableGendersRev = {
  мужской: 'девушку',
  женский: 'парня',
};

export async function findCompanion(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const user = await conversation.external(() =>
    db.user.findUnique({
      where: {
        tg_id: ctx.from.id.toString(),
      },
    }),
  );

  const genderFilter = await conversation.external(() =>
    user.form_looking_for == 'не важно'
      ? { not: 'nan' }
      : user.form_looking_for == 'парня'
        ? 'мужской'
        : 'женский',
  );

  const suitableUsersByCity = await conversation.external(() =>
    db.user.findMany({
      where: {
        tg_id: { not: user.tg_id },
        form_is_exist: true,
        form_gender: genderFilter,
        form_looking_for: { not: comparableGendersRev[user.form_gender] },
        searching: true,
        tg_is_bot: false,
        form_city: user.form_city,
      },
      select: { tg_id: true },
    }),
  );

  const suitableUsersNotByCity = await conversation.external(() =>
    db.user.findMany({
      where: {
        tg_id: { not: user.tg_id },
        form_is_exist: true,
        form_gender: genderFilter,
        form_looking_for: { not: comparableGendersRev[user.form_gender] },
        searching: true,
        tg_is_bot: false,
        form_city: { not: user.form_city },
      },
      select: { tg_id: true },
    }),
  );

  await conversation.external(() => shuffle(suitableUsersByCity));
  await conversation.external(() => shuffle(suitableUsersNotByCity));

  const allUsers = await conversation.external(() => [
    ...suitableUsersByCity,
    ...suitableUsersNotByCity,
  ]);
  conversation.log(allUsers);

  let exitMessage = 'Для тебя нету подходящих анкет, заходи позже!';

  for (let index = 0; index < allUsers.length; index++) {
    conversation.log(index);
    const currentUser = await conversation.external(() =>
      db.user.findUnique({
        where: { tg_id: allUsers[index].tg_id },
      }),
    );

    if (currentUser.likes.includes(user.tg_id)) {
      continue;
    }

    exitMessage = 'Это были все анкеты, подходящие для тебя...';

    await ctx.replyWithPhoto(currentUser.form_image_id, {
      caption: `${currentUser.form_name}, ${currentUser.form_city.charAt(0).toUpperCase()}${currentUser.form_city.slice(1)}, ${currentUser.form_age} — ${currentUser.form_desc}`,
      reply_markup: assessmentKeyboard,
    });

    const context = await getAnswerUntilEnd(conversation, ctx);
    if (context.message.text == '/start' || context.message.text == '💤') {
      await sendForm(user, ctx);
      return;
    } else if (context.message.text == '❤️') {
      await conversation.external(() =>
        db.user.update({
          where: { tg_id: allUsers[index].tg_id },
          data: { likes: { push: user.tg_id } },
        }),
      );
    }
  }

  await ctx.reply(exitMessage);
  await sendForm(user, ctx);
  return;
}

async function getAnswerUntilEnd(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<MyContext> {
  const context = await conversation.wait();

  if (
    context.message.text == '💤' ||
    context.message.text == '❤️' ||
    context.message.text == '👎' ||
    context.message.text == '/start'
  ) {
    return context;
  } else {
    ctx.reply('Нет такого варианта ответа');
    return await getAnswerUntilEnd(conversation, ctx);
  }
}
