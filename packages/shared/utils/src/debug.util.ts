export function Debug(
  target: unknown,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  console.debug({ methodName });

  descriptor.value = async function (...args: unknown[]) {
    try {
      console.debug({ args });

      const result = await originalMethod.apply(this, args);

      console.debug({ result });

      return result;
    } catch (err) {
      console.error(err);

      // hacking HTTPException due to circular dependency
      if (Object.prototype.hasOwnProperty.call(err, 'getHTTPError')) {
        const httpErr = (
          err as {
            getHTTPError: () => {
              internal_code: number;
              internal_message: string;
            };
          }
        ).getHTTPError();
        console.debug({
          internal_code: httpErr.internal_code,
          internal_message: httpErr.internal_message,
        });
      }

      throw err as Error;
    }
  };

  return descriptor;
}
