/** Promise に上限時間を付ける（ハングした Firestore / fetch 対策） */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "timeout"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(label));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      }
    );
  });
}
