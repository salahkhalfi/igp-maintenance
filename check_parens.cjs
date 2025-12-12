const fs = require('fs');
const content = fs.readFileSync('/home/user/webapp/public/static/js/components/CreateTicketModal.js', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Simple parser ignoring strings/comments for now (imperfect but helps find structure issues)
    if (char === '(') stack.push({char, index: i});
    if (char === ')') {
        if (stack.length > 0 && stack[stack.length-1].char === '(') {
            stack.pop();
        } else {
            console.log(`Extra ) at index ${i}`);
        }
    }
}

if (stack.length > 0) {
    console.log('Unmatched ( at:');
    stack.forEach(item => {
        // Find line number
        let line = 1;
        let col = 0;
        let currentIdx = 0;
        for(let l of lines) {
            if (currentIdx + l.length + 1 > item.index) {
                col = item.index - currentIdx;
                console.log(`Line ${line}, Col ${col}`);
                break;
            }
            currentIdx += l.length + 1; // +1 for newline
            line++;
        }
    });
} else {
    console.log('Parentheses look balanced (ignoring strings/comments)');
}
