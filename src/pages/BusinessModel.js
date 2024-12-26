import React, { useCallback, useRef, useState } from 'react';
import {
    VStack, HStack, Text, Button, Select, Input, Card, CardBody, CardHeader, Alert, AlertIcon,
    List, ListItem, FormControl, FormLabel, Box, Icon, SimpleGrid, Progress, Flex,
    useBreakpointValue, Heading, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton
} from '@chakra-ui/react';
import { FaBusinessTime, FaChartLine, FaUsers, FaLightbulb, FaRedo, FaEye } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from "../apis/api";
import LoadingScreen from "../components/common/LoadingMotion";

const BusinessModel = ({ customData, onBusinessSelect, onCustomDataChange }) => {
    const queryClient = useQueryClient();
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const columnCount = useBreakpointValue({ base: 1, md: 2 });
    const businessModelRef = useRef(null);

    const businessModelMessages = [
        "비즈니스 모델을 분석 중입니다...",
        "수익 구조를 최적화하고 있어요.",
        "고객 세그먼트를 정의하고 있습니다.",
        "가치 제안을 구체화하고 있어요.",
        "핵심 자원과 활동을 파악 중입니다.",
        "JIWOO AI가 당신의 비즈니스 모델을 혁신하고 있어요!",
    ];

    // Queries
    const { data: businesses = [], isError: isBusinessesError } = useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {
            const response = await api.get('/business/user', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access-token')}` }
            });
            return response.data.business || [];
        }
    });

    const { data: categories = [], isError: isCategoriesError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/category/names', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access-token')}` }
            });
            return response.data || [];
        }
    });

    // Mutations
    const similarServicesMutation = useMutation({
        mutationFn: async (data) => {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('access-token')}`,
                'Content-Type': 'application/json'
            };
            const response = await api.post('/business-model/similar-services', data, { headers });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['similarServices'], data);
            setCurrentStep(2);
        }
    });

    const analyzeBusinessModelMutation = useMutation({
        mutationFn: async (similarServices) => {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('access-token')}`,
                'Content-Type': 'application/json'
            };
            const response = await api.post('/business-model/analyze', similarServices, { headers });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['analyzedBusinessModel'], data);
            setCurrentStep(3);
        }
    });

    const proposeBusinessModelMutation = useMutation({
        mutationFn: async (analyzedBusinessModel) => {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('access-token')}`,
                'Content-Type': 'application/json'
            };
            const response = await api.post('/business-model/propose', JSON.stringify(analyzedBusinessModel), { headers });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['businessProposal'], data);
            setCurrentStep(4);
        }
    });

    // Get cached data
    const similarServices = queryClient.getQueryData(['similarServices']) || [];
    const analyzedBusinessModel = queryClient.getQueryData(['analyzedBusinessModel']);
    const businessProposal = queryClient.getQueryData(['businessProposal']);

    const getSimilarServices = async () => {
        if (!selectedBusiness && !customData?.category) {
            return;
        }

        let data;
        if (selectedBusiness) {
            data = {
                id: selectedBusiness.id,
                businessName: selectedBusiness.businessName,
                businessNumber: selectedBusiness.businessNumber,
                businessContent: selectedBusiness.businessContent,
                businessLocation: selectedBusiness.businessLocation,
                businessStartDate: selectedBusiness.businessStartDate,
                businessPlatform: selectedBusiness.businessPlatform || '',
                businessScale: selectedBusiness.businessScale || '',
                investmentStatus: selectedBusiness.investmentStatus || '',
                customerType: selectedBusiness.customerType || '',
            };
        } else {
            data = {
                ...customData,
                businessName: customData.category,
            };
        }

        await similarServicesMutation.mutateAsync(data);
    };

    const analyzeBusinessModels = async () => {
        await analyzeBusinessModelMutation.mutateAsync(similarServices);
    };

    const proposeBusinessModel = async () => {
        await proposeBusinessModelMutation.mutateAsync(analyzedBusinessModel);
    };

    const handleBusinessSelect = useCallback((event) => {
        const selectedId = parseInt(event.target.value, 10);
        const selected = businesses.find(b => b.id === selectedId);
        if (selected) {
            setSelectedBusiness(selected);
            if (typeof onBusinessSelect === 'function') {
                onBusinessSelect(selected);
            }
        }
    }, [businesses, onBusinessSelect]);

    const handleNewAnalysis = () => {
        setSelectedBusiness(null);
        setCurrentStep(1);
        queryClient.removeQueries(['similarServices']);
        queryClient.removeQueries(['analyzedBusinessModel']);
        queryClient.removeQueries(['businessProposal']);
    };

    const renderStepIndicator = () => (
        <Box mb={8}>
            <Progress value={(currentStep / 4) * 100} size="sm" colorScheme="blue" />
            <HStack justify="space-between" mt={2}>
                {['사업 선택', '유사 서비스', '모델 분석', '모델 제안'].map((step, index) => (
                    <Text key={index} fontWeight={currentStep >= index + 1 ? "bold" : "normal"} fontSize="sm">
                        {index + 1}. {step}
                    </Text>
                ))}
            </HStack>
        </Box>
    );

    const renderBusinessSelection = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaBusinessTime} />
                    <Heading size="md">사업 선택 또는 정보 입력</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Select
                    placeholder="사업 선택"
                    onChange={handleBusinessSelect}
                    value={selectedBusiness?.id || ''}
                    mb={4}
                >
                    {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                            {business.businessName}
                        </option>
                    ))}
                </Select>
                {!selectedBusiness && (
                    <SimpleGrid columns={columnCount} spacing={4}>
                        <FormControl>
                            <FormLabel>사업 분야 (카테고리)</FormLabel>
                            <Select
                                name="category"
                                value={customData?.category || ''}
                                onChange={onCustomDataChange}
                                placeholder="카테고리 선택"
                            >
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>사업 규모</FormLabel>
                            <Input
                                name="scale"
                                value={customData?.scale || ''}
                                onChange={onCustomDataChange}
                                placeholder="예: 중소기업"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>국가</FormLabel>
                            <Input
                                name="nation"
                                value={customData?.nation || ''}
                                onChange={onCustomDataChange}
                                placeholder="예: 대한민국"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>고객유형</FormLabel>
                            <Input
                                name="customerType"
                                value={customData?.customerType || ''}
                                onChange={onCustomDataChange}
                                placeholder="예: B2B"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>사업유형</FormLabel>
                            <Input
                                name="businessType"
                                value={customData?.businessType || ''}
                                onChange={onCustomDataChange}
                                placeholder="예: 소프트웨어 개발"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>사업내용</FormLabel>
                            <Input
                                name="businessContent"
                                value={customData?.businessContent || ''}
                                onChange={onCustomDataChange}
                                placeholder="사업 내용을 간략히 설명해주세요"
                            />
                        </FormControl>
                    </SimpleGrid>
                )}
                <Button
                    mt={4}
                    colorScheme="blue"
                    onClick={getSimilarServices}
                    isLoading={similarServicesMutation.isPending}
                >
                    다음 단계
                </Button>
            </CardBody>
        </Card>
    );

    const renderSimilarServices = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaUsers} />
                    <Heading size="md">유사 서비스</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                {similarServices.length > 0 ? (
                    <List spacing={3}>
                        {similarServices.map((service, index) => (
                            <ListItem key={index}>
                                <Text>{service.businessName || service.name || '이름 없음'}</Text>
                                {service.analysis && (
                                    <Text fontSize="sm" color="gray.600" mt={1}>
                                        {service.analysis}
                                    </Text>
                                )}
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Text>유사 서비스가 없습니다.</Text>
                )}
                <Button
                    mt={4}
                    colorScheme="blue"
                    onClick={analyzeBusinessModels}
                    isLoading={analyzeBusinessModelMutation.isPending}
                >
                    비즈니스 모델 분석
                </Button>
            </CardBody>
        </Card>
    );

    const renderAnalyzedBusinessModel = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaChartLine} />
                    <Heading size="md">비즈니스 모델 분석 결과</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Text whiteSpace="pre-wrap">{analyzedBusinessModel?.analysis}</Text>
                <Button
                    mt={4}
                    colorScheme="blue"
                    onClick={proposeBusinessModel}
                    isLoading={proposeBusinessModelMutation.isPending}
                >
                    비즈니스 모델 제안
                </Button>
            </CardBody>
        </Card>
    );

    const renderBusinessProposal = () => (
        <Card>
            <CardHeader>
                <HStack>
                    <Icon as={FaLightbulb} />
                    <Heading size="md">비즈니스 모델 제안</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Text whiteSpace="pre-wrap">{businessProposal?.proposal}</Text>
            </CardBody>
        </Card>
    );

    const renderFullResults = () => (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="full">
            <ModalOverlay />
            <ModalContent maxWidth="90vw" maxHeight="90vh">
                <ModalHeader>전체 분석 결과</ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY="auto" p={6}>
                    <VStack spacing={8} align="stretch">
                        <Box>
                            <Heading size="md" mb={4}>유사 서비스</Heading>
                            <List spacing={3}>
                                {similarServices.map((service, index) => (
                                    <ListItem key={index}>
                                        <Text fontWeight="bold">{service.businessName || service.name || '이름 없음'}</Text>
                                        {service.analysis && (
                                            <Text mt={1}>{service.analysis}</Text>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        {analyzedBusinessModel && (
                            <Box>
                                <Heading size="md" mb={4}>비즈니스 모델 분석 결과</Heading>
                                <Text whiteSpace="pre-wrap">{analyzedBusinessModel.analysis}</Text>
                            </Box>
                        )}

                        {businessProposal && (
                            <Box>
                                <Heading size="md" mb={4}>비즈니스 모델 제안</Heading>
                                <Text whiteSpace="pre-wrap">{businessProposal.proposal}</Text>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );

    const isLoading =
        similarServicesMutation.isPending ||
        analyzeBusinessModelMutation.isPending ||
        proposeBusinessModelMutation.isPending;

    const error =
        isBusinessesError ||
        isCategoriesError ||
        similarServicesMutation.error ||
        analyzeBusinessModelMutation.error ||
        proposeBusinessModelMutation.error;

    return (
        <Box ref={businessModelRef} width="70%" margin="auto" pt={24} mb={12} minHeight="1000px">
            <Box mt={8}/>
            <LoadingScreen isLoading={isLoading} messages={businessModelMessages} />
            {!isLoading && (
                <>
                    <Flex justifyContent="space-between" alignItems="center" mb={8}>
                        <Heading as="h1" size="2xl" mb={8}>비즈니스 모델👨‍💼</Heading>
                    </Flex>
                    {renderStepIndicator()}
                    <VStack spacing={8} align="stretch">
                        {error && (
                            <Alert status="error">
                                <AlertIcon />
                                {error.message}
                            </Alert>
                        )}
                        {currentStep === 1 && renderBusinessSelection()}
                        {currentStep === 2 && renderSimilarServices()}
                        {currentStep === 3 && renderAnalyzedBusinessModel()}
                        {currentStep === 4 && renderBusinessProposal()}
                        {currentStep > 1 && (
                            <HStack justifyContent="space-between">
                                <Button
                                    leftIcon={<Icon as={FaRedo} />}
                                    onClick={handleNewAnalysis}
                                >
                                    새로운 분석 시작
                                </Button>
                                <Button
                                    rightIcon={<Icon as={FaEye} />}
                                    onClick={() => setIsModalOpen(true)}
                                    isDisabled={!analyzedBusinessModel || !businessProposal}
                                >
                                    전체 결과 보기
                                </Button>
                            </HStack>
                        )}
                    </VStack>
                    {renderFullResults()}
                </>
            )}
        </Box>
    );
};

export default BusinessModel;