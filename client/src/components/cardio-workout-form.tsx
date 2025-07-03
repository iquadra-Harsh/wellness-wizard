import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

const cardioWorkoutFormSchema = z.object({
  type: z.string().min(1, "Workout type is required"),
  workoutType: z.string().default("cardio"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  distance: z.number().optional(),
  caloriesBurned: z.number().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

type CardioWorkoutFormData = z.infer<typeof cardioWorkoutFormSchema>;

interface CardioWorkoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cardioTypes = [
  "running",
  "walking",
  "cycling",
  "swimming",
  "rowing",
  "elliptical",
  "stairmaster",
  "treadmill",
  "outdoor biking",
  "hiking",
  "dancing",
  "kickboxing",
  "aerobics",
  "jump rope",
  "sports",
  "other",
];

export function CardioWorkoutForm({
  open,
  onOpenChange,
}: CardioWorkoutFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CardioWorkoutFormData>({
    resolver: zodResolver(cardioWorkoutFormSchema),
    defaultValues: {
      type: "",
      workoutType: "cardio",
      duration: 30,
      distance: undefined,
      caloriesBurned: undefined,
      notes: "",
      date: new Date().toISOString().slice(0, 16),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CardioWorkoutFormData) => {
      const response = await apiRequest("POST", "/api/workouts", {
        workout: {
          ...data,
          date: data.date ? new Date(data.date) : new Date(),
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/stats"] });
      toast({ title: "Cardio workout logged successfully!" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log cardio workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CardioWorkoutFormData) => {
    createMutation.mutate(data);
  };

  const selectedType = form.watch("type");
  const showDistance = [
    "running",
    "walking",
    "cycling",
    "swimming",
    "outdoor biking",
    "hiking",
  ].includes(selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Log Cardio Workout
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cardioTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showDistance && (
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (miles)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              parseFloat(e.target.value) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How did you feel? Route details? Any observations?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Logging..." : "Log Workout"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
