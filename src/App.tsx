import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { DataRow, DataType, DataTypeValues, Notation } from "./types";
import CustomBarChart from "./components/charts/CustomBarChart";
import { Toggle } from "./components/ui/toggle";
import { Separator } from "./components/ui/separator";

const FormSchema = z.object({
    file: z.instanceof(FileList).optional(),
});

function App() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    const [rows, setRows] = useState<DataRow[]>();
    const [cols, setCols] = useState<unknown[]>();
    const [allPlayers, setAllPlayers] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

    const fileRef = form.register("file");

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log("data", data);
        if (!data.file || data.file.length !== 1) {
            return;
        }

        const f = await data.file[0].arrayBuffer();

        const wb = read(f); // parse the array buffer
        const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet

        const localAllPlayers: string[] = [];

        const localRows: DataRow[] = (
            utils.sheet_to_json(ws, { header: 1 }) as string[][]
        )
            .map((row: string[]) => {
                if (
                    !localAllPlayers.includes(row[3]) &&
                    !["", "Nom", undefined].includes(row[3])
                ) {
                    localAllPlayers.push(row[3]);
                }

                return {
                    type: row[1] as DataType,
                    name: row[3],
                    value: row[2] as Notation,
                };
            })
            .filter(
                (row: { name: string; value: Notation; type: string }) =>
                    !["", "Nom"].includes(row.name) && row.name
            );
        /* rows are generated with a simple array of arrays */
        setRows(localRows);

        // ---- Update selectedPLayers array ----
        setSelectedPlayers(localAllPlayers);
        setAllPlayers(localAllPlayers);

        /* column objects are generated based on the worksheet range */
        const range = utils.decode_range(ws["!ref"] || "A1");
        setCols(
            Array.from({ length: range.e.c + 1 }, (_, i) => ({
                /* for an array of arrays, the keys are "0", "1", "2", ... */
                key: String(i),
                /* column labels: encode_col translates 0 -> "A", 1 -> "B", 2 -> "C", ... */
                name: utils.encode_col(i),
            }))
        );
    }

    useEffect(() => {
        if (rows) {
            console.log("rows", rows);
        }

        if (cols) {
            console.log("cols", cols);
        }
    }, [rows, cols]);

    return (
        <div className="flex flex-col gap-8 p-1 md:p-4">
            <h1>Volley Stats</h1>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-1/1 space-y-6"
                >
                    <FormField
                        control={form.control}
                        name="file"
                        render={() => (
                            <FormItem>
                                <FormLabel>Stats File</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept=".xlsx"
                                        placeholder="shadcn"
                                        {...fileRef}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Select your stats file to get analytics
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Load Stats</Button>
                </form>
            </Form>
            <Separator />
            <div>
                <h2>Players</h2>
                {allPlayers.map((player) => (
                    <Toggle
                        aria-label="Toggle Player"
                        onClick={() => {
                            if (selectedPlayers.length === allPlayers.length) {
                                setSelectedPlayers([player]);

                                return;
                            }

                            if (selectedPlayers.includes(player)) {
                                setSelectedPlayers(
                                    selectedPlayers.length === 1
                                        ? allPlayers
                                        : selectedPlayers.filter(
                                              (value) => value !== player
                                          )
                                );

                                return;
                            }

                            setSelectedPlayers([...selectedPlayers, player]);
                        }}
                    >
                        {player}
                    </Toggle>
                ))}
            </div>
            {rows && (
                <div className="w-1/1 flex flex-wrap">
                    <div className="w-1/1 md:w-1/2">
                        <span>Attacks</span>
                        <CustomBarChart
                            dataRows={rows.filter((value) =>
                                selectedPlayers.includes(value.name)
                            )}
                            type={DataTypeValues.ATTACK}
                            stackBars={
                                selectedPlayers.length === allPlayers.length
                            }
                        />
                    </div>
                    <div className="w-1/1 md:w-1/2">
                        <span>Defense</span>
                        <CustomBarChart
                            dataRows={rows.filter((value) =>
                                selectedPlayers.includes(value.name)
                            )}
                            type={DataTypeValues.DEFENSE}
                            stackBars={
                                selectedPlayers.length === allPlayers.length
                            }
                        />
                    </div>
                    <div className="w-1/1 md:w-1/2">
                        <span>Serve</span>
                        <CustomBarChart
                            dataRows={rows.filter((value) =>
                                selectedPlayers.includes(value.name)
                            )}
                            type={DataTypeValues.SERVE}
                            stackBars={
                                selectedPlayers.length === allPlayers.length
                            }
                        />
                    </div>
                    <div className="w-1/1 md:w-1/2">
                        <span>Recep</span>
                        <CustomBarChart
                            dataRows={rows.filter((value) =>
                                selectedPlayers.includes(value.name)
                            )}
                            type={DataTypeValues.RECEP}
                            stackBars={
                                selectedPlayers.length === allPlayers.length
                            }
                        />
                    </div>
                    <div className="w-1/1 md:w-1/2">
                        <span>Block</span>
                        <CustomBarChart
                            dataRows={rows.filter((value) =>
                                selectedPlayers.includes(value.name)
                            )}
                            type={DataTypeValues.BLOCK}
                            stackBars={
                                selectedPlayers.length === allPlayers.length
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
