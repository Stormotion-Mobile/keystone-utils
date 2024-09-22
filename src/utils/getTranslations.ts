import * as deepl from "deepl-node";

export const getTranslations = async (
  deeplKey: string,
  textInEnglish: string | string[],
  localesToTranslate: string[] | string,
  context?: string
): Promise<Record<string, string | string[]>> => {
  const translator = new deepl.Translator(deeplKey);

  const localesArray = Array.isArray(localesToTranslate)
    ? localesToTranslate
    : [localesToTranslate];

  const translations = await localesArray.reduce(async (acc, locale) => {
    const resolved = await acc;
    try {
      const result = await translator.translateText(
        textInEnglish,
        "en",
        locale as deepl.TargetLanguageCode,
        { context: context, preserveFormatting: true }
      );
      const translationText = Array.isArray(result)
        ? result.map((item) => item.text)
        : result.text;
      return { ...resolved, [locale]: translationText };
    } catch (error) {
      console.log(error);
      return resolved;
    }
  }, Promise.resolve({ en: textInEnglish }));

  return translations;
};
