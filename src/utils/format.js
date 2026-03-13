export function scorePassword(value) {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
}

export function strengthLabel(score) {
    return ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score] || '—';
}

export function initials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');
}

export function badgeClass(status) {
    const map = {
        Pending: 'badge-pending',
        Confirmed: 'badge-confirmed',
        Completed: 'badge-completed',
        Declined: 'badge-declined',
        Cancelled: 'badge-cancelled'
    };
    return map[status] || 'badge-pending';
}

export function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount, currency = 'INR') {
    if (amount === undefined || amount === null || Number.isNaN(amount)) return '';
    const value = Number(amount);
    return `${currency} ${value.toLocaleString('en-IN')}`;
}
