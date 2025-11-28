import { storage } from './storage';

const BACKUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_BACKUPS = 2;

export const autoBackup = {
    init: () => {
        // 1. Startup Check: Restore if needed (logic can be expanded, for now we just ensure backups exist)
        // In a real app, we might check if the current state is empty but a backup exists.
        // For now, we just log that we are initialized.
        console.log('AutoBackup initialized');

        // 2. Schedule Interval Backup
        setInterval(() => {
            autoBackup.performBackup('auto');
        }, BACKUP_INTERVAL_MS);

        // 3. Exit Save
        window.addEventListener('beforeunload', () => {
            autoBackup.performBackup('exit');
        });
    },

    performBackup: (type: 'auto' | 'exit' | 'manual') => {
        try {
            const allData = storage.getAll();
            const timestamp = new Date().toISOString();
            const backupData = {
                timestamp,
                type,
                data: allData
            };

            // Save as latest backup
            storage.set('backup_latest', backupData);

            // Manage history (keep last 2)
            const history = storage.get<any[]>('backup_history') || [];
            history.unshift(backupData);

            // Keep only max backups
            if (history.length > MAX_BACKUPS) {
                history.length = MAX_BACKUPS;
            }

            storage.set('backup_history', history);
            console.log(`Backup performed (${type}) at ${timestamp}`);
        } catch (error) {
            console.error('Backup failed:', error);
        }
    },

    restoreFromLatest: (): boolean => {
        try {
            const latest = storage.get<any>('backup_latest');
            if (latest && latest.data) {
                Object.keys(latest.data).forEach(key => {
                    storage.set(key, latest.data[key]);
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    }
};
