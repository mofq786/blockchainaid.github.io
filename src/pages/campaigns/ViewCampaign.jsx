// UI imports..
import React from "react";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { Box, Button, fabClasses, styled, Grid } from "@mui/material";
import { Container, Link, TextField, MenuItem, Typography } from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import Modal from "@mui/material/Modal";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Chip from "@mui/material/Chip";
import { LoadingButton } from "@mui/lab";
import InputAdornment from '@mui/material/InputAdornment';
// local imports..
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
// service imports..
import axios from "axios";

import { useEffect, useState } from "react";
// Wallet connection..
import { useWallet } from "use-wallet";
// form handling
import { useForm } from "react-hook-form";
// [block-chain] smart-contract related imports..
import { getCampaignDetails } from "../../../utils/getCampaigns";

// smart-contract interaction -- for contribution of funds, withdrawing money & ending campaign.
import Campaign from "../../../utils/contract/campaign";
import web3 from "../../../utils/web3";

// stylings..
const StyledModal = styled(Modal)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const api_url = "https://eth-sepolia.g.alchemy.com/v2/zKcZ0eD-TwTnQ4iMLH9GTNIjl-exhAV1";
//const api_url = "http://localhost:5173/";

function ViewCampaign() {
  const campaignId = window.location.pathname.substring(10); // will get as '/campaign/xx`, trimmed to get ONLY the id.

  // hooks..
  const [ethAmount, setEthAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState("");
  const [conversionRates, setConversionRates] = useState({});

  const currencies = ["USD", "EUR", "GBP", "INR"]; // List of supported currencies

  useEffect(() => {
    // Fetch conversion rates when the component mounts
    fetchConversionRates();
  }, []);

  const fetchConversionRates = async () => {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur,gbp,inr"
      );
      setConversionRates(response.data.ethereum);
    } catch (error) {
      console.error("Error fetching conversion rates:", error);
    }
  };

  const handleEthAmountChange = (event) => {
    const { value } = event.target;
    setEthAmount(value);

    // Convert the entered ETH amount to the selected currency
    convertEthToSelectedCurrency(value, selectedCurrency);
  };

  const handleCurrencyChange = (event) => {
    const { value } = event.target;
    setSelectedCurrency(value);

    // Convert the entered ETH amount to the newly selected currency
    convertEthToSelectedCurrency(ethAmount, value);
  };

  const convertEthToSelectedCurrency = (amountInEth, currency) => {
    // Check if conversion rates have been fetched
    if (Object.keys(conversionRates).length === 0) return;
    const Currency = currency.toLowerCase();
    console.log(currency);
    // Use the fetched rate to calculate the converted amount for the selected currency
    let rate = conversionRates[Currency];
    let convertedAmount = amountInEth * rate;
    setConvertedAmount(convertedAmount.toFixed(2)); // Round to 2 decimal places
  };



  const [responseMsg, setResponseMsg] = React.useState(""); // to display error messages.
  const [showResponse, setShowResponse] = React.useState(false); // To know whether error occured. ⁉ why not use length of error message
  const [responseSeverity, setResponseSeverity] = React.useState("error");

  const [abortCampaignMsg, setAbortCampaignMsg] = React.useState("");

  const [fundingAmount, setFundingAmount] = React.useState(0); // set this via ref's and onchange.
  const enteredAmountRef = React.useRef(0);

  const [campaignData, setCampaignData] = React.useState({});
  const wallet = useWallet();

  // for dealing with form values -- at contribution..
  const {
    handleSubmit: contributionHandleSubmit,
    register: contributionRegister,
    formState: contributionFormState,
    reset: contributionReset,
  } = useForm({
    mode: "onChange",
  });

  // for dealing with form values -- at abort campaign..
  const {
    handleSubmit: abortHandleSubmit,
    register: abortRegister,
    formState: abortFormState,
    reset: abortReset,
  } = useForm({
    mode: "onChange",
  });

  // for dealing with form values -- at withdraw raised funds..
  const {
    handleSubmit: withdrawHandleSubmit,
    register: withdrawRegister,
    formState: withdrawFormState,
    reset: withdrawReset,
  } = useForm({
    mode: "onChange",
  });

  const [isContributionSuccess, setIsContributionSuccess] =
    React.useState(false);
  const [contributionError, setContributionError] = React.useState("");
  const [abortingError, setAbortingError] = React.useState("");
  const [endAndWithdrawError, setEndAndWithdrawError] = React.useState("");

  // for testing purpose..
  const etherScanAddress = "0xA34E5560BA3e7758022cfEAc510A5cA1DB8D61EC"; // some dummy address.
  // these are for the -- campaignData[] -- where usage of '.' operator isn't working.
  const minAmountKey = "minContribAmount";
  const raisedMoneyKey = "ethRaised";

  // hooks..
  const [showEndCampaignConfirmation, setShowEndCampaignConfirmation] =
    React.useState(false);
  const [acceptanceStatus, setAcceptanceStatus] = React.useState(false);

  useEffect(() => {
    console.log("fetching a campaign..");
    let ignore = false;
    // fetch the campaigns..
    const fetchData = async () => {
      await getCampaignDetails(campaignId).then((data) => {
        console.info(data);
        if (!ignore && data != undefined) setCampaignData(data);
      });
    };

    fetchData(); // call the function to fetch the data

    return () => {
      ignore = true; // to avoid rendering multiple times..
    };
  }, []);

  // helpers ..
  function LinearProgressWithLabel(props) {
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ width: "100%", mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value
          )}%`}</Typography>
        </Box>
      </Box>
    );
  }


  // async function abortCampaign() {
  const handleAbortCampaign = async (data) => {
    console.log("abort campaign called");
    console.log(data);
    if (data.acceptCondition === false && data.campaignAbortReason.length == 0)
      return;

    // proceed further, only when valid.
    console.log("about to perform aborting..");
    try {
      const campaign = Campaign(campaignData.id); // get the campaign
      const accounts = await web3.eth.getAccounts(); // backer account..
      await campaign.methods.abortCampaignAndRefund().send({
        from: accounts[0],
      });

      console.log("abort success");
      window.location.reload();
      // after successful abort..
      abortReset("", { keepValues: false }); // clear the values entered.
    } catch (err) {
      console.log(err);
      setAbortingError(err);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowResponse(false);
  };

  const handleAmountChange = (e) => {
    const balanceAmount = campaignData.ethRaised - campaignData.ethFunded;
    const value = e.target.value;
    const minValue = campaignData.minContribAmount;
    if (value < minValue) {
      setFundingAmount(minValue);
      enteredAmountRef.current.value = minValue;
    } else if (value > balanceAmount) {
      setFundingAmount(balanceAmount);
      enteredAmountRef.current.value = balanceAmount;
    } else setFundingAmount(value);
  };

  const handleContributedFunds = async (data) => {
    console.info("handle contribute funds called");
    console.log(data);

    try {
      if (data.contribAmount < campaignData.minContribAmount)
        throw {
          name: "Invalid contribution amount. Transaction aborted",
          message: `Contribution cannot be < ${campaignData.minContribAmount}.`,
        };

      const campaign = Campaign(campaignData.id); // get the campaign
      const accounts = await web3.eth.getAccounts(); // backer account..
      await campaign.methods.contribute().send({
        // register contribution..
        from: accounts[0],
        value: web3.utils.toWei(data.contribAmount, "ether"),
      });

      // after successful contribution..
      contributionReset("", { keepValues: false }); // clear the values entered.
      setIsContributionSuccess(true);
    } catch (err) {
      console.log(err);
      setContributionError(err);
    }
  };

  const handleEndAndWithdraw = async (data) => {
    console.log("Withdraw called");
    try {
      const campaign = Campaign(campaignData.id); // get the campaign
      const accounts = await web3.eth.getAccounts(); // backer account..
      await campaign.methods.endCampaignAndCredit().send({
        from: accounts[0],
      });

      // after successful end & credit..
      console.log("Funds credited successfully to fundraiser's wallet.");
      window.location.reload();
    } catch (err) {
      console.log(err);
      setEndAndWithdrawError(err);
    }
  };

  // components..
  // other modules..
  function ShowCampaignDetails() {
    return (
      <>
        <Box sx={{ margin: 5, width: {sm:"50%",xs:"100%"} }}>
        <Stack direction="column" spacing={2}>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '1rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'}}}>
        About Campaign
      </Typography>
      <Container sx={{ padding: 2, backgroundColor: "#EDFF9B", borderRadius: 3 }}>
        <Box display="flex" alignItems="center">
          <Box display={"flex"}
                  flexDirection="row"
                  alignItems={"flex-start"} sx={{flex:1}}>
          <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '1rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'}}}>
            {campaignData.title}
          </Typography>
          <Chip
            label={campaignData.campaignStatus}
            size="small"
            color={campaignData.campaignStatus === "ACTIVE" || campaignData.campaignStatus === "SUCCESS" ? "success" : "error"}
          />
          </Box>
          <a href={`https://sepolia.etherscan.io/address/${campaignData.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="contained" fontWeight="bold" color="primary" sx={{ mt: 1, alignContent:'end'}}>
            View on Sepolia Etherscan
          </Button>
        </a>
          
        </Box>
        <Typography variant="body2">
          <br/>
          <strong>Description</strong>: {campaignData.description}
        </Typography>
        
      </Container>
      <ShowContributionDetails />
      <EndCampaign />
    </Stack>
        </Box>
      </>
    );
  }

  function ShowContributionDetails() {
    return (
      <>
      <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '1rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'}}}>Contribution Details</Typography>
      <Container
      width="100%"
      sx={{ padding: 2, backgroundColor: "#EDFF9B", borderRadius: 3 }}>
        
        <Container>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'} }}>Minimum Contribution amount</Typography>
          <Typography>{campaignData.minContribAmount} ETH</Typography>
        </Container>
        <Container>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'} }}>Goal</Typography>
          <Typography>{`${campaignData.ethRaised}`} ETH</Typography>
        </Container>
        <Container>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'}}}>
            Wallet Address of FundRaiser
          </Typography>
          <Typography>{`${campaignData.createdBy}`}</Typography>
        </Container>
        <Container>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'}}}>
            Contributions are accepted till <i>(Deadline)</i>
          </Typography>
          <Typography>{`${new Date(campaignData.deadline)}`}</Typography>
          {(campaignData.campaignStatus == "EXPIRED" ||
            campaignData.campaignStatus == "ABORTED") && (
              <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'} }}>
              <i>No contributions can be accepted now.</i>
            </Typography>
          )}
        </Container>
        </Container>
      </>
    );
  }

  function ShowCampaignBalance() {
    return (
      <>
        <Container
          maxWidth="sm"
          sx={{ padding: 0.5, backgroundColor: "#EDFF9B", borderRadius: 3 }}
        >
          <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'}}}>Campaign balance</Typography>
          <Typography variant="caption">
            Amount stored in smart contract.
          </Typography>
          <LinearProgressWithLabel
            color="success" value={(campaignData.ethFunded / campaignData.ethRaised) * 100}
          />
          <Typography variant="body2">
            {`${campaignData.ethFunded}`} ETH funded by{" "}
            {`${campaignData.backersCount}`} Contributors.
          </Typography>
        </Container>
      </>
    );
  }

  function BecomeBacker() {
    return (
      <Container
        sx={{ padding: 0.5, backgroundColor: "#f1faee", borderRadius: 3 }}
        fixed
        maxWidth="sm"
      >
        <Stack direction="column" spacing={1.2}>
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'}}}>Be a Contributor</Typography>
          <Stack direction="row">
            <Typography variant="caption">
              How much would you like to fund?
            </Typography>
            <Typography
              sx={{ fontStyle: "italic", paddingLeft: 1 }}
              variant="caption"
              color="grey"
            >
              ≥ {campaignData.minContribAmount} ETH &amp; ≤{" "}
              {campaignData.ethRaised - campaignData.ethFunded} ETH
            </Typography>
          </Stack>
          {isContributionSuccess == true ? (
            <Alert
              severity="success"
              sx={{ marginTop: 2, marginBottom: 2 }}
              onClose={() => {
                setIsContributionSuccess(false);
                window.location.reload();
              }}
            >
              <AlertTitle>Funded successfully</AlertTitle>
              Thanks for your valuable contributions.
            </Alert>
          ) : (
            <form onSubmit={contributionHandleSubmit(handleContributedFunds)}>
              <Grid container spacing={2}>
  <Grid item xs={6}>
    <TextField
      label="Contribution amount &nbsp; &nbsp; "
      type="number"
      inputProps={{
        step: 0.00001,
        min: campaignData[minAmountKey],
        endAdornment: (<InputAdornment position="end">ETH</InputAdornment>),
      }}
      
      disabled={contributionFormState.isSubmitting}
      {...contributionRegister("contribAmount", { required: true })}
      helperText="Enter amount in Ether you want to contribute."
      fullWidth
      size="small"
      value={ethAmount}
      onChange={handleEthAmountChange}
    />
  </Grid>
  <Grid item xs={6}>
    <TextField
      id="convertedAmount"
      label='Fiat Currency &nbsp;'
      size="small"
      type="text"
      fullWidth
      value={convertedAmount}
      InputProps={{
        endAdornment: (
          <TextField
            variant="standard"
            id="currency-select"
            select
            value={selectedCurrency}
            onChange={handleCurrencyChange}
            size="small"
            
            fullWidth
          >
            {currencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </TextField>
        ),
      }}
      disabled={contributionFormState.isSubmitting}
    />
  </Grid>
</Grid>

              
              {contributionError && (
                <Alert
                  severity="error"
                  sx={{ marginTop: 2, marginBottom: 2 }}
                  onClose={() => {
                    setContributionError(""); // erase the error msg.
                    window.location.reload(); // re-load the page to get the updated status
                  }}
                >
                  <AlertTitle>{contributionError.name}</AlertTitle>
                  {contributionError.message}
                </Alert>
              )}
              {wallet.status === "connected" ? (
                <LoadingButton
                  variant="contained"
                  type="submit"
                  fullWidth
                  loading={contributionFormState.isSubmitting}
                  sx={{ marginTop: 1 }}
                >
                  Contribute Funds
                </LoadingButton>
              ) : (
                <Alert
                  severity="error"
                  sx={{ margin: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => wallet.connect()}
                    >
                      Connect
                    </Button>
                  }
                >
                  Please connect your wallet to proceed.
                </Alert>
              )}
            </form>
          )}

          <Typography variant="subtitle2" color="grey">
            Scheme - All or Nothing.
          </Typography>
          <Typography variant="caption" paragraph color="grey">
            The money you fund, will be stored in smart contract that you can
            trust. Your money gets refunded in-case if the project doesn't reach
            goal or cancelled in-between, and transferred if reached goal.
          </Typography>
        </Stack>
      </Container>
    );
  }

  function WithDrawFunds() {
    return (
      <Container
        sx={{ padding: 2, backgroundColor: "#EACEE5", borderRadius: 3 }}
        fixed
        maxWidth="sm"
      >
        <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem'}}}>
          Withdraw Raised Funds
        </Typography>
        {/* -------- Here.. based on the deadline of the campaign, validate can withdraw or not. */}
        <Alert severity="info" sx={{ marginTop: 1 }}>
          To withdraw raised funds, campaign has to be <strong>ended</strong>
        </Alert>
        {endAndWithdrawError && (
          <Alert
            severity="error"
            sx={{ marginTop: 2, marginBottom: 2 }}
            onClose={() => {
              setEndAndWithdrawError(""); // erase the error msg.
              window.location.reload(); // re-load the page to get the updated status
            }}
          >
            <AlertTitle>{endAndWithdrawError.name}</AlertTitle>
            {endAndWithdrawError.message}
          </Alert>
        )}
        <form onSubmit={withdrawHandleSubmit(handleEndAndWithdraw)}>
          <Alert severity="warning" sx={{ marginTop: 1, marginBottom: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  required
                  color="error"
                  name="acceptConditions"
                  value="yes"
                />
              }
              label="I/We understand that, once campaign has ended it cannot be reversed."
              sx={{ padding: 1 }}
            />
          </Alert>

          <LoadingButton
            type="submit"
            fullWidth
            variant="contained"
            loading={withdrawFormState.isSubmitting}
            color="secondary"
            disabled={withdrawFormState.isSubmitting}
          >
            End campaign &amp; withdraw
          </LoadingButton>
        </form>
      </Container>
    );
  }

  function EndCampaign() {
    return (
      <>
        {wallet.account === campaignData.createdBy &&
          (campaignData.campaignStatus === "ACTIVE" ||
            campaignData.campaignStatus === "SUCCESS") && (
            <>
              <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'},fontFamily:'monospace' }}>Danger Zone</Typography>
              <Container
                sx={{
                  backgroundColor: "#EE0630",
                  padding: 1,
                  borderRadius: 3,
                }}
              >
                <Stack direction="row" alignItems={"center"}>
                  <Container>
                    <Typography variant="body1" color="#ffffff">
                      <strong>Quit</strong> &amp; <strong>Refund</strong>
                    </Typography>
                    <Typography variant="caption" color="#FFFF98">
                      Once you end a campaign, there is no going back. Please be
                      certain.
                    </Typography>
                  </Container>
                  <LoadingButton
                    variant="contained"
                    loading={abortFormState.isSubmitting}
                    color="warning"
                    size="small"
                    onClick={() => setShowEndCampaignConfirmation(true)}
                  >
                    Abort campaign
                  </LoadingButton>
                </Stack>
              </Container>
            </>
          )}
      </>
    );
  }

  function EndCampaignDialog() {
    return (
      <>
        <StyledModal
          open={showEndCampaignConfirmation}
          onClose={() => setShowEndCampaignConfirmation(false)}
        >
          <Box
            width={400}
            height={300}
            bgcolor={"background.default"}
            color={"text.primary"}
            p={3}
            borderRadius={3}
            display="flex"
            flexDirection={"column"}
            gap={1}
            sx={{ justifyContent: "center" }}
            // component="form"
            // onSubmit={abortCampaign}
          >
            <Typography
              variant="h6"
              color="error"
              textAlign="center"
              gutterBottom
            >
              Abort Campaign
            </Typography>
            {abortingError && (
              <Alert
                severity="error"
                sx={{ marginTop: 2, marginBottom: 2 }}
                onClose={() => {
                  setAbortingError(""); // erase the error msg.
                  window.location.reload(); // re-load the page to get the updated status
                }}
              >
                <AlertTitle>{abortingError.name}</AlertTitle>
                {abortingError.message}
              </Alert>
            )}
            <form onSubmit={abortHandleSubmit(handleAbortCampaign)}>
              <Stack direction="column">
                <TextField
                  label="Why would you like to abort campaign?"
                  multiline
                  required
                  rows={3}
                  {...abortRegister("campaignAbortReason", {
                    required: true,
                  })}
                  variant="standard"
                  disabled={abortFormState.isSubmitting}
                />
                <Typography variant="caption">
                  This reason will be published in campaign page to notify
                  viewers and contributors.
                </Typography>
              </Stack>
              <Stack direction={"column"}>
                <FormControlLabel
                  control={
                    <Checkbox required {...abortRegister("acceptCondition")} />
                  }
                  label="I accept that, if I abort campaign, all the raised money can be refunded back to the backers."
                />

                <LoadingButton
                  color="error"
                  variant="contained"
                  type="submit"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  disabled={abortFormState.isSubmitting}
                >
                  Abort Campaign &amp; Refund to backers
                </LoadingButton>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={() => setShowEndCampaignConfirmation(false)}
                  fullWidth
                  sx={{ marginTop: 1 }}
                  disabled={abortFormState.isSubmitting}
                >
                  Cancel
                </Button>
              </Stack>
            </form>
          </Box>
        </StyledModal>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Stack
  direction={{ xs: "column", sm: "row" }} // Change direction based on screen size
  divider={<Divider orientation={{ xs: "horizontal", sm: "vertical",lg: "vertical",md: "vertical" }} flexItem />}
  spacing={2}
  justifyContent={{ xs: "center", sm: "space-around" }} // Adjust justification based on screen size
  alignItems={{ xs: "flex-start", sm: "baseline" }} // Adjust alignment based on screen size
>
  <ShowCampaignDetails />
  <Box sx={{ margin: 2, width: { xs: "100%", sm: "40%" } }}> {/* Adjust width based on screen size */}
    <Stack direction={"column"} spacing={2}>
    <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '1rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'}}}>
        Current Status of campaign
      </Typography>
      <ShowCampaignBalance />
      {campaignData.campaignStatus === "ACTIVE" ||
      campaignData.campaignStatus === "SUCCESS" ? (
        <>
          {wallet.account !== campaignData.createdBy ? (
            <>
              <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '1rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'}}}>
                Contribute
              </Typography>
              <BecomeBacker />
            </>
          ) : (
            <>
              <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'},fontFamily:'monospace' }}>
                Withdraw
              </Typography>
              <WithDrawFunds />
            </>
          )}
        </>
      ) : (
        <>
          <Typography variant="caption" color="#000000" fontWeight="bold" paragraph sx={{ margin: 0,fontSize: {xs: '0.75rem', sm: '0.75rem', md: '1rem', lg: '1.25rem', xl: '1.5rem'},fontFamily:'monospace' }}>
            End status
          </Typography>
          <Container>
            <Typography>
              {campaignData.campaignStatus === "EXPIRED"
                ? "Campaign has ended successfully..!!"
                : "Campaign has Aborted."
              }
            </Typography>
          </Container>
        </>
      )}
    </Stack>
  </Box>
</Stack>

      <EndCampaignDialog />
      <Snackbar
        open={showResponse}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleClose} severity={responseSeverity}>
          {responseMsg}
        </Alert>
      </Snackbar>
      <Footer/>
    </>
  );
}

export default ViewCampaign;
