import React from "react";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";

const useProject = () => {
    const utils = api.useUtils()
    const { data: projects } = api.project.getProjects.useQuery(undefined, {
        staleTime: 0, // Always treat data as stale to ensure fresh data
        refetchOnWindowFocus: true, // Refetch when window regains focus
    })
    const [projectId, setProjectId] = useLocalStorage('raptor-projectId', '')
    const project = projects?.find((project: any) => project?.id === projectId)
    
    // Function to invalidate projects data
    const invalidateProjects = React.useCallback(() => {
        utils.project.getProjects.invalidate()
    }, [utils.project.getProjects])
    
    // Invalidate on mount
    React.useEffect(() => {
        invalidateProjects()
    }, [invalidateProjects])
    
    return {
        projects,
        project,
        projectId,
        setProjectId,
        invalidateProjects
    }
}

export default useProject