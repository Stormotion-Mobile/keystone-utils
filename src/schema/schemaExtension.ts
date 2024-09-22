import { graphql } from "@keystone-6/core";
import { getTranslations } from "../utils/getTranslations";

export const translationSchemaExtension = ({
  deeplKey,
  deeplContext,
}: {
  deeplKey: string;
  deeplContext: string;
}) =>
  graphql.extend(() => {
    return {
      query: {
        translatedValues: graphql.field({
          type: graphql.JSON,
          args: {
            value: graphql.arg({ type: graphql.nonNull(graphql.String) }),
            locales: graphql.arg({
              type: graphql.nonNull(
                graphql.list(graphql.nonNull(graphql.String))
              ),
            }),
          },
          resolve(_, { value, locales }) {
            return getTranslations(deeplKey, value, locales, deeplContext);
          },
        }),
      },
    };
  });
