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
import {
    DataRow,
    DataType,
    DataTypeValues,
    Notation,
} from "./types";
import CustomBarChart from "./components/charts/CustomBarChart";

const FormSchema = z.object({
    file: z.instanceof(FileList).optional(),
});

function App() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    const [rows, setRows] = useState<DataRow[]>();
    const [cols, setCols] = useState<unknown[]>();

    const fileRef = form.register("file");

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log("data", data);
        if (!data.file || data.file.length !== 1) {
            return;
        }

        const f = await data.file[0].arrayBuffer();

        const wb = read(f); // parse the array buffer
        const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet

        const localRows: DataRow[] = (
            utils.sheet_to_json(ws, { header: 1 }) as string[][]
        )
            .map((row: string[]) => ({
                type: row[1] as DataType,
                name: row[3],
                value: row[2] as Notation,
            }))
            .filter(
                (row: { name: string; value: Notation; type: string }) =>
                    !["", "Nom"].includes(row.name) &&
                    row.name
            );
        /* rows are generated with a simple array of arrays */
        setRows(localRows);

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
        <div>
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
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
            {rows && (
                <div className="w-1/1">
                    <span>Attacks</span>
                    <CustomBarChart dataRows={rows} type={DataTypeValues.ATTACK}/>
                    <span>Defense</span>
                    <CustomBarChart dataRows={rows} type={DataTypeValues.DEFENSE}/>
                    <span>Serve</span>
                    <CustomBarChart dataRows={rows} type={DataTypeValues.SERVE}/>
                    <span>Recep</span>
                    <CustomBarChart dataRows={rows} type={DataTypeValues.RECEP}/>
                    <span>Block</span>
                    <CustomBarChart dataRows={rows} type={DataTypeValues.BLOCK}/>
                </div>
            )}
        </div>
    );
}

export default App;
