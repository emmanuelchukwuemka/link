export type CategoryNode = {
    id: number;
    name: string;
    position: number;
    parentId: number | null;
    directCount: number;
    totalCount: number;
    children: CategoryNode[];
};
