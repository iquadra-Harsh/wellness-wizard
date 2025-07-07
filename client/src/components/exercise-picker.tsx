import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Info } from "lucide-react";
import { ExerciseDatabase } from "@shared/schema";

interface ExercisePickerProps {
  onExerciseSelect: (exercise: ExerciseDatabase) => void;
  trigger?: React.ReactNode;
}

export function ExercisePicker({
  onExerciseSelect,
  trigger,
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [level, setLevel] = useState("all");
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDatabase | null>(null);

  // Build the URL with query parameters
  const buildExerciseUrl = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (primaryMuscle && primaryMuscle !== "all")
      params.append("primaryMuscle", primaryMuscle);
    if (equipment && equipment !== "all") params.append("equipment", equipment);
    if (level && level !== "all") params.append("level", level);
    params.append("limit", "100");

    return `/api/exercises?${params}`;
  };

  // Fetch exercises based on filters - using default queryFn for proper auth
  const { data: exercises = [], isLoading } = useQuery<ExerciseDatabase[]>({
    queryKey: [buildExerciseUrl(), search, primaryMuscle, equipment, level],
    enabled: open,
  });

  // Get unique values for filters, ensuring no empty strings
  const exerciseList = (exercises || []) as ExerciseDatabase[];

  const uniquePrimaryMuscles: string[] = Array.from(
    new Set(
      exerciseList
        .flatMap((ex: ExerciseDatabase) => ex.primaryMuscles || [])
        .filter(
          (muscle: any) =>
            muscle && typeof muscle === "string" && muscle.trim() !== ""
        )
    )
  ) as string[];

  const uniqueEquipment: string[] = Array.from(
    new Set(
      exerciseList
        .map((ex: ExerciseDatabase) => ex.equipment)
        .filter((eq: any) => eq && typeof eq === "string" && eq.trim() !== "")
    )
  ) as string[];

  const uniqueLevels: string[] = Array.from(
    new Set(
      exerciseList
        .map((ex: ExerciseDatabase) => ex.level)
        .filter(
          (level: any) =>
            level && typeof level === "string" && level.trim() !== ""
        )
    )
  ) as string[];

  const handleExerciseSelect = (exercise: ExerciseDatabase) => {
    onExerciseSelect(exercise);
    setOpen(false);
    setSelectedExercise(null);
  };

  const clearFilters = () => {
    setSearch("");
    setPrimaryMuscle("all");
    setEquipment("all");
    setLevel("all");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Exercise Library</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Browse and select from over 800 exercises
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Exercise name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Primary Muscle</Label>
              <Select value={primaryMuscle} onValueChange={setPrimaryMuscle}>
                <SelectTrigger>
                  <SelectValue placeholder="Any muscle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any muscle</SelectItem>
                  {uniquePrimaryMuscles.map((muscle) => (
                    <SelectItem key={muscle} value={muscle}>
                      {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Any equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any equipment</SelectItem>
                  {uniqueEquipment.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {eq.charAt(0).toUpperCase() + eq.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any level</SelectItem>
                  {uniqueLevels.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      {lv.charAt(0).toUpperCase() + lv.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {exerciseList.length} exercises found
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Exercise List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-[400px] w-full">
              {isLoading ? (
                <div className="text-center py-8">Loading exercises...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {exerciseList.map((exercise: ExerciseDatabase) => (
                    <Card
                      key={exercise.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {exercise.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              {exercise.equipment && (
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.equipment}
                                </Badge>
                              )}
                              {exercise.level && (
                                <Badge variant="outline" className="text-xs">
                                  {exercise.level}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExercise(exercise);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {exercise.primaryMuscles?.map((muscle) => (
                            <Badge
                              key={muscle}
                              variant="default"
                              className="text-xs"
                            >
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExerciseSelect(exercise);
                          }}
                        >
                          Select Exercise
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Exercise Details Modal */}
      {selectedExercise && (
        <Dialog
          open={!!selectedExercise}
          onOpenChange={() => setSelectedExercise(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedExercise.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.equipment && (
                    <Badge variant="secondary">
                      {selectedExercise.equipment}
                    </Badge>
                  )}
                  {selectedExercise.level && (
                    <Badge variant="outline">{selectedExercise.level}</Badge>
                  )}
                  {selectedExercise.mechanic && (
                    <Badge variant="outline">{selectedExercise.mechanic}</Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Primary Muscles</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.primaryMuscles?.map((muscle) => (
                      <Badge key={muscle} variant="default">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedExercise.secondaryMuscles &&
                  selectedExercise.secondaryMuscles.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Secondary Muscles</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedExercise.secondaryMuscles.map((muscle) => (
                          <Badge key={muscle} variant="secondary">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedExercise.instructions &&
                  selectedExercise.instructions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Instructions</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {selectedExercise.instructions.map(
                          (instruction, index) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              {instruction}
                            </li>
                          )
                        )}
                      </ol>
                    </div>
                  )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleExerciseSelect(selectedExercise)}
                    className="flex-1"
                  >
                    Select This Exercise
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedExercise(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
