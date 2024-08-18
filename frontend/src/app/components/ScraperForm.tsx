"use client";

import React, { useState } from "react";
import { TextField, Button, Box, Snackbar } from "@mui/material";
import axios from "axios";

const ScraperForm: React.FC = () => {
  const [urls, setUrls] = useState<string>("");
  const [maxUrls, setMaxUrls] = useState<number>(50);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_EC2_URL}/api/scrape`,
        {
          urls: urls.split("\n").filter((url) => url.trim() !== ""),
          maxUrls,
        }
      );
      setSuccessMessage("Scraping completed successfully!");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("An error occurred while scraping.");
      setSuccessMessage(null);
    }
  };

  return (
    <Box>
      <TextField
        label="URLs (one per line)"
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
      />
      <TextField
        label="Max URLs"
        type="number"
        fullWidth
        variant="outlined"
        value={maxUrls}
        onChange={(e) => setMaxUrls(Number(e.target.value))}
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        fullWidth
        sx={{ marginTop: 2 }}
      >
        Scrape
      </Button>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
        action={
          <Button color="inherit" onClick={() => setErrorMessage(null)}>
            Close
          </Button>
        }
      />
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
        action={
          <Button color="inherit" onClick={() => setSuccessMessage(null)}>
            Close
          </Button>
        }
      />
    </Box>
  );
};

export default ScraperForm;
