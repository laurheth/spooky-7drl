export function randomElement<Type>(arr:Type[]):Type {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}