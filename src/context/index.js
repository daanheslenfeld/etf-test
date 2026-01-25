// Context Providers - Barrel Export

// Trading Context (IB connection, account, orders)
export { TradingProvider, useTrading } from './TradingContext';

// Filter Context (ETF filtering state)
export { FilterProvider, useFilter } from './FilterContext';

// Modal Context (modal management)
export { ModalProvider, useModal, MODAL_TYPES } from './ModalContext';

// Community Context (follows, leaderboards, trending)
export { CommunityProvider, useCommunity } from './CommunityContext';

// Notification Context (alerts, notifications)
export { NotificationProvider, useNotifications } from './NotificationContext';
