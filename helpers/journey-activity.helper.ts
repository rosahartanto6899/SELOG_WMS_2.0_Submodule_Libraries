/**
 * Journey Activity Helper
 *
 * Centralizes Journey activity label transformation used across
 * Journey History, Journey Supports, and Tracing & Tracking
 * to ensure consistent customer-facing activity labels.
 *
 * Source of Truth:
 * - Primary   : ActivityCode + ActivityType
 * - Fallback  : Activity + ActivityType (for backward compatibility)
 *
 * Business Rules:
 * - Loading (IN)      -> Loading in
 * - Loading (OUT)     -> Loading out
 * - Checkpoint (IN)   -> Checkpoint In
 * - Unloading (IN)    -> Unloading in
 * - Unloading (OUT)   -> Unloading out
 *
 * Special Rule:
 * - The final return activity keeps its original label
 *   (e.g. Arah Balik / Free Arah Balik).
 *
 * Notes:
 * - Does NOT modify activity ordering.
 * - Does NOT modify response schema.
 * - Uses ActivityCode when available.
 * - Falls back to Activity text if ActivityCode is not yet provided
 *   by Journey Service.
 */

const activityLabelMap: Record<string, string> = {
    'Loading-IN': 'Loading in',
    'Loading-OUT': 'Loading out',
    'Checkpoint-IN': 'Checkpoint In',
    'Unloading-IN': 'Unloading in',
};

function resolveActivityKey(activity: any): string {
    /**
     * Preferred mapping from Journey Service
     */
    if (activity.activityCode) {
        return `${activity.activityCode}-${activity.activityType}`;
    }

    /**
     * Backward compatibility while Journey Service
     * has not populated ActivityCode.
     */
    const name = activity.activity ?? '';

    if (
        activity.activityType === 'IN' &&
        /^Loading at/i.test(name)
    ) {
        return 'Loading-IN';
    }

    if (
        activity.activityType === 'OUT' &&
        name === 'On Journey'
    ) {
        return 'Loading-OUT';
    }

    if (
        activity.activityType === 'IN' &&
        /^Checkpoint at/i.test(name)
    ) {
        return 'Checkpoint-IN';
    }

    if (
        activity.activityType === 'IN' &&
        (/^Received at/i.test(name) ||
            /^Unloading at/i.test(name))
    ) {
        return 'Unloading-IN';
    }

    if (
        activity.activityType === 'OUT' &&
        ['Arah Balik', 'Free Arah Balik'].includes(name)
    ) {
        return 'Unloading-OUT';
    }

    return '';
}

export function transformJourneyActivityLabels<
    T extends Record<string, any>,
>(activities: T[]): T[] {
    const lastReturnOrdinal = Math.max(
        ...activities
            .filter((activity) => resolveActivityKey(activity) === 'Unloading-OUT')
            .map((activity) => activity.ordinal ?? 0),
        -1,
    );

    return activities.map((activity) => {
        const key = resolveActivityKey(activity);

        let activityName = activity.activity ?? '';

        /**
         * Transform standard activities.
         */
        if (activityLabelMap[key]) {
            activityName = `${activityLabelMap[key]} [${activity.locationName}]`;
        }

        /**
         * Transform intermediate unloading out.
         */
        if (
            key === 'Unloading-OUT' &&
            activity.ordinal !== lastReturnOrdinal
        ) {
            activityName = `Unloading out [${activity.locationName}]`;
        }

        /**
         * Keep final return activity unchanged.
         */
        if (
            key === 'Unloading-OUT' &&
            activity.ordinal === lastReturnOrdinal
        ) {
            activityName = activity.activity;
        }

        return {
            ...activity,
            activity: activityName,
        };
    });
}