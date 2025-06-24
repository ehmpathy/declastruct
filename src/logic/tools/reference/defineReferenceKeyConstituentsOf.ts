import { DomainObject } from 'domain-objects';

export class CanNotReferenceDeclaredResourceClassError extends Error {
  constructor({
    class: ofClass,
    reason,
  }: {
    class: typeof DomainObject;
    reason: string;
  }) {
    super(
      `
Can not reference declared resource of class '${ofClass.name}'. Instances of the class '${ofClass.name}' can not be referenced because ${reason}.
    `.trim(),
    );
  }
}

const isArrayOfStrings = (value: any): value is string[] => {
  if (!value) return false;
  if (!Array.isArray(value)) return false;
  return value.every((element) => typeof element === 'string');
};

export const defineReferenceKeyConstituentsOf = ({
  class: ofClass,
}: {
  class: any;
}) => {
  if (!isArrayOfStrings(ofClass.primary))
    throw new CanNotReferenceDeclaredResourceClassError({
      class: ofClass,
      reason: `the static property 'primary' was not defined as an array of strings`,
    });
  if (!isArrayOfStrings(ofClass.unique))
    throw new CanNotReferenceDeclaredResourceClassError({
      class: ofClass,
      reason: `the static property 'unique' was not defined as an array of strings`,
    });
  return {
    primary: ofClass.primary as string[],
    unique: ofClass.unique as string[],
  };
};
