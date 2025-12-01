export function getCallerNameFromStack(): string | null {
    const trace = new Error().stack;
    if (!trace) return null;
    const lines = trace.split('\n').map(l => l.trim());
    // lines[0] = "Error", lines[1] = this function, lines[2] = caller of this function (ce qu'on veut)
    const callerLine = lines[2] || lines[1];
    // Formats possibles : "at MyClass.myMethod (file:line:col)" ou "at file:line:col"
    const m1 = callerLine.match(/at (.+?) \(/);
    if (m1 && m1[1]) return m1[1];
    const m2 = callerLine.match(/at (.+):\d+:\d+/);
    return m2 ? m2[1] : callerLine;
}

console.trace(getCallerNameFromStack())