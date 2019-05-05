import React, { Component } from 'react';
import { Row, Col, Collapse, Table } from 'antd';
import ShowModal from '../../components/ShowModal';
import BorderedButton from '../../components/BorderedButton';
import { cryptoCurrencies, cryptoColor, currencySymbols } from '../../constants/cryptos';
import './index.scss';
import "antd/dist/antd.css";
import * as BlockchainInteraction from '../../utils/SubmitTransactions/ReturnInstances';
import { CryptoDescription } from '../../constants/cryptoDescription';
import Loader from '../../components/Loader';
import * as CryptoCompare from '../../utils/CryptoCompare';
const Panel = Collapse.Panel;

const importAll = require =>
    require.keys().reduce((acc, next) => {
        acc[next.replace("./", "")] = require(next);
        return acc;
    }, {});

const images = importAll(
    require.context("../../../../node_modules/cryptocurrency-icons/svg/color", false, /\.(svg)$/)
);
const noOfCryptos = 13;


class DetailsTab extends Component {

    constructor(props) {
        super(props);
        this.state = {
            currency: "",
            showModal: false,
            showLoading: false,
            cryptoValue: "0",
            fiatValue: "0.00"
        }
        this.setCrypto = this.setCrypto.bind(this);
    }

    componentWillMount() {
        let selectedCrypto = window.location.href
        selectedCrypto = selectedCrypto.split('?')[2] || 0;
        let crypto = cryptoCurrencies[selectedCrypto].label;
        this.blockchainInteraction = BlockchainInteraction.getInstance(crypto);
        this.setCrypto();
    }

    componentWillReceiveProps(props) {
        if (!this.props.toggle)
            this.props.toggleMenu();
        let selectedCrypto = window.location.href
        selectedCrypto = selectedCrypto.split('?')[2] || 0;
        let crypto = cryptoCurrencies[selectedCrypto].label;
        this.blockchainInteraction = BlockchainInteraction.getInstance(crypto);
        this.setCrypto();
    }

    hideModal = () => {
        this.setState({ showModal: false });
    }

    sendButton = () => {
        this.setState({ showModal: true, buttonText: "send" })
    }

    receiveButton = () => {
        this.setState({ showModal: true, buttonText: "receive" })
    }

    toggleCryptoMenu = () => {
        this.props.toggleMenu();
    }

    setTableData = () => {
        if (this.blockchainInteraction === undefined) {
            this.setState({ expandalbleDataSource: undefined, showLoading: false });
            return;
        }

        this.blockchainInteraction.getTransaction().then(res => {
            this.setState({ expandalbleDataSource: res });
        })
    }

    showTransactionDetails = (record) => {
        let txHash = record.txHash;
        let url = this.blockchainInteraction.getTransactionDetails(txHash);
        window.open(url)
    }

    setCrypto = () => {
        let selectedCrypto = window.location.href
        selectedCrypto = selectedCrypto.split('?')[2] || 0;
        let crypto = cryptoCurrencies[selectedCrypto];
        let currency = crypto.currency.toUpperCase();
        if (this.blockchainInteraction !== undefined) {
            this.setState({ showLoading: true }, () => {
                this.blockchainInteraction.getBalance().then(res => {
                    debugger;
                    console.log(res);
                    CryptoCompare.convert(currency, localStorage.getItem("defaultCurrency")).then(value => {
                        value = JSON.parse(value);
                        let fiatValue = value[currency.toString()][localStorage.getItem("defaultCurrency")] * res;
                        fiatValue = fiatValue.toString();
                        this.setState({ fiatValue: fiatValue.substr(0, 6), showLoading: false });
                    })
                    res = res.toString();
                    this.setState({ cryptoValue: res.substr(0, 4) });
                }).catch(err => {
                    this.setState({ showLoading: false });
                    console.log(err);
                })
            })
        }
        else {
            this.setState({ cryptoValue: "0.00", fiatValue: "0.00" });
        }
        this.setTableData();
        this.cryptoCurrencyColor = cryptoColor[cryptoCurrencies[selectedCrypto].label]
        this.setState({ crypto: cryptoCurrencies[selectedCrypto].label, currency: cryptoCurrencies[selectedCrypto].currency })
    }

    formatDescription = (description) => {
        let address = this.blockchainInteraction.getWalletInfo().address;
        let paragraphArray = [];
        for (let key in description) {
            if (description[key] === address) {
                paragraphArray.push(
                    <p>{key}: {description[key]} <text style={{ color: "green" }}>(SELF)</text></p>
                )
            }
            else {
                paragraphArray.push(
                    <p>{key}: {description[key]}</p>
                )
            }
        }
        return (
            <div style={{ margin: 0, lineHeight: 1, cursor: "default" }}>
                {paragraphArray}
            </div>
        )
    }

    render() {

        const expandableColumns = [
            {
                title: "Transaction Hash",
                dataIndex: "txHash",
                key: "txHash"
            },
            {
                title: "Value",
                dataIndex: "txValue",
                key: "txValue"
            }
        ]
        console.log(this.state.crypto)
        const defaultCurrency = localStorage.getItem("defaultCurrency")

        return (
            <div>
                {
                    this.state.showLoading ?
                        <div className="detailsTab" style={{ display: "grid" }}>
                            <Loader />
                        </div>
                        :
                        <div style={{ textAlign: "center" }}>
                            <Row gutter={24} className="detailsTab">
                                <Col align="middle">
                                    <div className="cryptoIcon">
                                        <img width="80px" onClick={this.toggleCryptoMenu} src={images[`${this.state.currency}.svg`]} />
                                    </div>
                                </Col>
                                <Col align="middle">
                                    <div>
                                        <div className="cryptoCurrency" style={{ color: this.cryptoCurrencyColor }}>
                                            <span id="check" className="cryptoAvailable">{this.state.cryptoValue}</span><span>{this.state.currency}</span></div>
                                        <div className="defaultCurrency">{currencySymbols[defaultCurrency]}{this.state.fiatValue} {defaultCurrency}</div>
                                    </div>
                                </Col>
                                <div className="buttons">
                                    <Col xs={24} sm={24} md={24} lg={12} xl={12} align="middle" className="sendButton">
                                        <div>
                                            <BorderedButton text="Send" onClick={this.sendButton} />
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={24} md={24} lg={12} xl={12} align="middle" className="receiveButton">
                                        <div>
                                            <BorderedButton text="Receive" onClick={this.receiveButton} />
                                        </div>
                                    </Col>
                                </div>
                                {this.state.showModal &&
                                    <ShowModal
                                        crypto={this.state.crypto.toUpperCase()}
                                        buttonText={this.state.buttonText}
                                        hideModal={this.hideModal}
                                        refreshTransactionTable={this.setTableData}
                                        crypto={this.state.crypto}
                                        currency={this.state.currency}
                                    />
                                }
                                <div className="test">
                                    <Col span={24} className="description">
                                        <Collapse accordion bordered={false} >
                                            <Panel align="left" header="DESCRIPTION" key="1">
                                                <p className="descriptionText">
                                                    {CryptoDescription[this.state.crypto].split("\n").map((i, key) => {
                                                        return <text style={{color: "cornsilk"}} key={key}>{i}<br/></text>;
                                                    })}
                                                </p>
                                            </Panel>
                                            <Panel header="TRANSACTIONS" key="2" style={{ overflow: "auto" }}>
                                                <Row>
                                                    <Col className="transactionTable" style={{ maxWidth: "80vw" }}>
                                                        {
                                                            this.state.expandalbleDataSource !== undefined ?
                                                                <Table
                                                                    onRow={(record, rowIndex) => {
                                                                        return {
                                                                            onClick: (event) => { this.showTransactionDetails(record) },
                                                                        };
                                                                    }}
                                                                    columns={expandableColumns}
                                                                    dataSource={this.state.expandalbleDataSource}
                                                                    expandedRowRender={record => this.formatDescription(record.description)}
                                                                    pagination={false}
                                                                    style={{ overflow: "scroll" }}
                                                                // locale={{ emptyText: (<span>not available</span>) }}
                                                                />
                                                                :
                                                                <p className="noTransaction">{`No ${this.state.crypto} Transactions`}</p>
                                                        }
                                                    </Col>
                                                </Row>
                                            </Panel>
                                        </Collapse>
                                    </Col>
                                </div>

                            </Row>
                        </div>
                }
            </div>
        )
    }
}

export default DetailsTab;
