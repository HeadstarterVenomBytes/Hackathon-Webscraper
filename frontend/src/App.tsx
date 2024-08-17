import React from "react";
import { Container, Typography, CssBaseline } from "@mui/material";
import ScraperForm from "./components/ScraperForm";

function App() {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="h1" variant="h5">
        Web Scraper
      </Typography>
      <ScraperForm />
    </Container>
  );
}

export default App;
