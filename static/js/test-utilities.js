describe('clearChildren', function() {
    it('Removes all children from the passed HTML Element', function() {
        const div = document.createElement('div');
        const child1 = document.createElement('p');
        const child2 = document.createElement('form');
        div.append(child1, child2);
        expect(div.children.length).toEqual(2);
        clearChildren(div);
        expect(div.children.length).toEqual(0);
    })
})