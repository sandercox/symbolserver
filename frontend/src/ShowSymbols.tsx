import { useState, useEffect, FC } from "react";
import { Table, Alert } from "react-bootstrap";
import SymbolService, { Symbol } from "./SymbolApi";

export const ShowSymbols: FC = () => {
  const [symbols, setSymbols] = useState<Symbol[] | null>(null);

  useEffect(() => {
      console.log("Loading symbols");
    SymbolService.recentFiles().then((symbols) => setSymbols(symbols));
  }, []);

console.log(symbols);
  if (symbols) {
    return (
      <>
<h3>Symbols stored</h3>
<Table striped bordered hover>
  <thead>
    <tr>
      <th>id</th>
      <th>Filename</th>
      <th>Path</th>
      <th># served</th>
    </tr>
  </thead>
  <tbody>
        {symbols.map((sym, idx) => {
          return (
          <tr key={idx}>
            <td>{sym.id}</td>
            <td>{sym.filename}</td>
            <td>{sym.path}</td>
            <td>{sym.serveCount}</td>
          </tr>
          
            );
        })}

  </tbody>
</Table>

      </>
    );
  }

  return <Alert variant="secondary">Loading symbols...</Alert>;
};
