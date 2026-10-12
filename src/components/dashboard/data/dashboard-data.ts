import {
    Clock,
    Cpu,
    Download,
    Recycle,
    Sprout,
    TriangleAlert,
    User,
    Wind,
} from 'lucide-react'
import type { KpiCardProps } from '../kpi-card'
import type { ActiveBatchPhase } from '../active-batches-chart'
import type { AlertItem } from '../needs-attention'
import type { BatchRow } from '../recent-batches-table'

export type DashboardData = {
    kpis: KpiCardProps[]
    phaseData: ActiveBatchPhase[]
    alerts: AlertItem[]
    recentBatches: BatchRow[]
    totalThisMonth: number
}

export type DashboardApiResponse = {
    kpis: KpiCardProps[]
    phaseData: ActiveBatchPhase[]
    alerts: AlertItem[]
    recentBatches: BatchRow[]
    totalThisMonth: number
}

export const mockDashboardData: DashboardData = {
    kpis: [
        {
            label: 'Total waste processed',
            value: '128,400',
            unit: 'kg',
            delta: '+12.8%',
            icon: Recycle,
        },
        {
            label: 'Curing-ready compost produced',
            value: '38,600',
            unit: 'kg',
            delta: '+8.2%',
            icon: Sprout,
        },
        {
            label: 'Estimated avoided methane',
            value: '645',
            unit: 'CO₂',
            delta: '+12.8%',
            icon: Wind,
        },
        {
            label: 'Machines online',
            value: '23',
            unit: '/ 24',
            delta: '+9.1%',
            icon: Cpu,
        },
        {
            label: 'Avg. days to stabilization',
            value: '24.5',
            unit: 'days',
            delta: '-1.8 days',
            deltaTone: 'bad',
            icon: Clock,
        },
    ],
    phaseData: [
        { name: 'Mesophilic', value: 6, color: '#C9E856' },
        { name: 'Thermophilic', value: 9, color: '#718619' },
        { name: 'Cooling', value: 5, color: '#4F8352' },
    ],
    alerts: [
        {
            icon: TriangleAlert,
            title: 'Machine offline',
            description: 'AIVSP-012 · last seen 2 hours ago',
            time: '2h ago',
        },
        {
            icon: Clock,
            title: 'Batch past expected duration',
            description: 'QC-0903 · day 31 of 28',
            time: 'Today',
        },
        {
            icon: User,
            title: 'Account has no machine linked',
            description: 'New operator signed up today',
            time: 'Today',
        },
        {
            icon: Download,
            title: 'Firmware update available',
            description: 'AIVSP-004 · v1.3.2',
            time: '9:41 AM',
        },
    ],
    recentBatches: [
        {
            id: 'QC-0926',
            account: 'Nina Reyes',
            barangay: 'Barangay 176-E',
            machine: 'AIVSP-001',
            weight: '300 kg',
            days: '24 days',
            completed: 'Sep 28',
        },
        {
            id: 'QC-0925',
            account: 'Marco Santos',
            barangay: 'Barangay Bagong Silangan',
            machine: 'AIVSP-002',
            weight: '280 kg',
            days: '26 days',
            completed: 'Sep 27',
        },
        {
            id: 'PG-0924',
            account: 'Leah Cruz',
            barangay: 'Barangay San Joaquin',
            machine: 'AIVSP-007',
            weight: '310 kg',
            days: '23 days',
            completed: 'Sep 25',
        },
        {
            id: 'MK-0923',
            account: 'Omar Tan',
            barangay: 'Barangay Tumana',
            machine: 'AIVSP-004',
            weight: '295 kg',
            days: '27 days',
            completed: 'Sep 24',
        },
        {
            id: 'SM-0922',
            account: 'Maya Gomez',
            barangay: 'Barangay Ampid I',
            machine: 'AIVSP-012',
            weight: '305 kg',
            days: '25 days',
            completed: 'Sep 22',
        },
    ],
    totalThisMonth: 45,
}
