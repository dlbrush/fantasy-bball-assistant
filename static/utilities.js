/**
 * This code was found at https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript on 4/23/21
 * @param {HTMLNode} target 
 */
function clearChildren(target) {
    while (target.firstChild) {
        target.removeChild(target.lastChild);
      }
}