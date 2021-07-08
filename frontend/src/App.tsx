import React from "react";
import "./App.css";

import { BrowserRouter, Switch, Route } from "react-router-dom";

import { Jumbotron, Navbar, Nav, Form, Button } from "react-bootstrap";

import { ShowSymbols } from "./ShowSymbols";
import {UploadSymbols} from "./UploadSymbols";

function App() {
  return (
    <BrowserRouter>
      <>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="/">Symbol Server</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="/add">Add</Nav.Link>
              <Nav.Link href="/docs">Docs</Nav.Link>
            </Nav>
            <Form inline>
              <Form.Control type="text" placeholder="symbol name" className="mr-sm-2" />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Navbar.Collapse>
        </Navbar>
        <Jumbotron className="content">
          <Switch>
            <Route exact path="/">
              <ShowSymbols />
            </Route>
            <Route path="/add">
              <UploadSymbols />
            </Route>
            <Route path="/docs">
              <div>docs</div>
            </Route>
          </Switch>
        </Jumbotron >
        <Navbar
          className="footer-nav justify-content-center"
          bg="dark"
          variant="dark"
          fixed="bottom"
        >
          <Nav>
            <Nav.Link href="https://paralleldimension.nl/">
              copyright (c) 2021 Parallel Dimension
            </Nav.Link>
            <Nav.Link href="https://github.com/sandercox/symbolserver/">
              {process.env.REACT_APP_SHA || "SHA"}
            </Nav.Link>
          </Nav>
        </Navbar>
      </>
    </BrowserRouter>
  );
}

export default App;
