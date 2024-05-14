import { z } from 'zod';

export const UserFormSchema = z.object({
  form_name: z
    .string()
    .min(1, 'Введи своё имя. Оно будет отображаться в твоей анкете.')
    .max(25),
  form_gender: z.enum(['мужской', 'женский']),
  form_looking_for: z.enum(['девушку', 'парня', 'не важно']),
  form_desc: z.string().max(250, 'Описание не должно превышать 250 символов.'),
  form_image_id: z.string(),
  form_city: z.string(),
  form_age: z
    .number()
    .min(6, 'Возраст слишком низкий')
    .max(70, 'Возраст слишком велик'),
});
