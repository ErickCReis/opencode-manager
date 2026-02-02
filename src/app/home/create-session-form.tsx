import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { DialogFooter } from "@app/components/ui/dialog";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@app/components/ui/combobox";
import { api } from "@lib/api";

export function CreateSessionForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [repoValue, setRepoValue] = useState("");

  const { data: githubUser } = useQuery({
    queryKey: ["githubUser"],
    queryFn: () => api.auth.github.user.get().then((res) => res.data?.data),
    retry: false,
  });

  const { data: userRepos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["userRepos"],
    queryFn: () => api.auth.github.repos.get().then((res) => res.data?.data ?? []),
    enabled: !!githubUser,
    retry: false,
  });

  const form = useForm({
    defaultValues: { repo: "", branch: "main" },
    onSubmit: async ({ value }) => {
      await api.sessions.post({
        repo: value.repo,
        branch: value.branch,
      });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onClose();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="space-y-4">
        <form.Field
          name="repo"
          validators={{
            onChange: ({ value }) => (!value ? "Repository is required" : undefined),
          }}
        >
          {(field) => (
            <>
              <Label htmlFor={field.name}>Repository (owner/repo)</Label>
              {githubUser ? (
                <Combobox
                  value={repoValue}
                  onValueChange={(value) => {
                    setRepoValue(value || "");
                    field.handleChange(value || "");
                  }}
                >
                  <ComboboxInput placeholder="Search repositories..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {isLoadingRepos ? (
                        <ComboboxEmpty>Loading...</ComboboxEmpty>
                      ) : userRepos?.length === 0 ? (
                        <ComboboxEmpty>No repositories found</ComboboxEmpty>
                      ) : (
                        userRepos?.map((repo) => (
                          <ComboboxItem key={repo.id} value={repo.full_name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{repo.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {repo.full_name}
                              </span>
                            </div>
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="owner/repo"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-500 mt-1">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        </form.Field>
        <form.Field
          name="branch"
          validators={{
            onChange: ({ value }) => (!value ? "Branch is required" : undefined),
          }}
        >
          {(field) => (
            <>
              <Label htmlFor={field.name}>Branch</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="main"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-sm text-red-500 mt-1">{field.state.meta.errors[0]}</p>
              )}
            </>
          )}
        </form.Field>
      </div>
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        )}
      />
    </form>
  );
}
