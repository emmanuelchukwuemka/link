import DashboardLayout from '@/layouts/dashboard-layout';
import { StoreProductsPanel } from '@/components/dashboard/store-products-panel';

export default function StorePage() {
    return (
        <DashboardLayout>
            <StoreProductsPanel />
        </DashboardLayout>
    );
}
