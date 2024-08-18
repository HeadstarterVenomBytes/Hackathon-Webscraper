import { Container, Typography } from "@mui/material";
import ScraperForm from "./components/ScraperForm";

export default function Home() {
  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5">
        Web Scraper
      </Typography>
      <ScraperForm />
    </Container>
  );
}
