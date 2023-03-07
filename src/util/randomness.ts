export function randomElement<Type>(arr:Type[], removeElement=false):Type {
    const index = Math.floor(Math.random() * arr.length);
    const element = arr[index];
    if (removeElement) {
        arr.splice(index, 1);
    }
    return element;
}