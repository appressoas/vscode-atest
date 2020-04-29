describe('Fancy stuff in module1', () => {
    test('multiply 10 * 3 to equal 30', () => {
        expect(10 * 3).toBe(30);
    });

    test('multiply 10 divided by 2 to equal 5', () => {
        expect(10 / 2).toBe(5);
    });

    test('failed multiplication of 1 * 2 to equal 4', () => {
        expect(1 * 2).toBe(4);
    });
});
