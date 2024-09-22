import { gql } from "@keystone-6/core/admin-ui/apollo";

export const QUERY_LOCALES = gql`
  query {
    locales {
      id
      code
      name
      priority
    }
  }
`;

export const QUERY_TRANSLATED_VALES = gql`
  query ($value: String!, $locales: [String!]!) {
    translatedValues(value: $value, locales: $locales)
  }
`;
