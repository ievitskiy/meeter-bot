import { Keyboard } from 'grammy';

export const createFormKeyboard = new Keyboard()
  .text('Создать анкету')
  .resized()
  .persistent();

export const leaveKeyboard = new Keyboard().text('Отменить создание').resized();

export const keyboardWithCurrent = new Keyboard()
  .text('Оставить текущее')
  .resized();

export const genderKeyboard = new Keyboard()
  .text('Мужской')
  .text('Женский')
  .resized()
  .row()
  .text('Отменить создание')

  .persistent();

export const lookingForKeyboard = new Keyboard()
  .text('Девушку')
  .text('Парня')
  .text('Не важно')
  .resized()
  .row()
  .text('Отменить создание')

  .persistent();

export const menuKeyboard = new Keyboard()
  .text('🔎')
  .text('📖')
  .text('💤')
  .resized();

export const assessmentKeyboard = new Keyboard()
  .text('❤️')
  .text('👎')
  .text('💤')
  .resized();
